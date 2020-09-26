const {use, expect} = require("chai");
const {utils, Contract, ContractFactory} = require("ethers");
const {
  deployMockContract,
  MockProvider,
  solidity,
  deployContract,
} = require("ethereum-waffle");
const IPriceProducer = require("../build/IPriceProducer.json");
const ITreasury = require("../build/ITreasury.json");
const IPolicy = require("../build/IPolicy.json");
const MockDAI = require("../build/MockDAI.json");
const Underwriter = require("../build/Underwriter.json");
const rawMockAbi = [
  " function __waffle__call(address target, bytes calldata data) external returns (bytes memory)",
];

use(solidity);

describe("Underwriter", function () {
  let mockPriceProducer;
  let mockPriceProducerRaw;
  let mockTreasury;
  let mockDai;
  let mockPolicy;
  let contract;

  const provider = new MockProvider();
  const [deployerWallet, userWallet] = provider.getWallets();

  async function getCurrentTimeStamp() {
    const blockNumber = await provider.getBlockNumber();
    return (await provider.getBlock(blockNumber)).timestamp;
  }

  async function callRawMock(mock, contract, functionName, ...args) {
    const rawMock = new Contract(mock.address, rawMockAbi, deployerWallet);
    const tx = await contract.populateTransaction[functionName](...args);
    return mockPriceProducerRaw.__waffle__call(contract.address, tx.data);
  }

  beforeEach(async () => {
    mockPriceProducer = await deployMockContract(
      deployerWallet,
      IPriceProducer.abi
    );
    mockPriceProducerRaw = new Contract(
      mockPriceProducer.address,
      rawMockAbi,
      deployerWallet
    );
    mockTreasury = await deployMockContract(deployerWallet, ITreasury.abi);

    mockPolicy = await deployMockContract(deployerWallet, IPolicy.abi);

    mockDai = await deployContract(deployerWallet, MockDAI);
    contract = await deployContract(deployerWallet, Underwriter, [
      mockTreasury.address,
      mockPriceProducer.address,
      mockPolicy.address,
      mockDai.address,
    ]);

    await mockDai.transfer(userWallet.address, utils.parseEther("1"));

    //Call all contracts as users
    contract = contract.connect(userWallet);
    mockDai = mockDai.connect(userWallet);
  });

  it("Reject request with amount above maximum", async function () {
    const maximumCover = await contract.maxCoverAmount();
    const policyRequest = createPolicyRequest(10000, 2500, maximumCover + 1);

    await expect(contract.buyPolicy(policyRequest)).to.be.revertedWith(
      "Amount exceeds maximum"
    );
  });

  it("Reject request with amount 0", async function () {
    const policyRequest = createPolicyRequest(10000, 2500, 0);

    await expect(contract.buyPolicy(policyRequest)).to.be.revertedWith(
      "Amount must be positive"
    );
  });

  it("Reject request with duration 0", async function () {
    const policyRequest = createPolicyRequest(0, 2500);

    await expect(contract.buyPolicy(policyRequest)).to.be.revertedWith(
      "Duration must be positive"
    );
  });

  it("Reject request with duration above maximum", async function () {
    const maximumCover = await contract.maxPolicyDurationInS();

    const policyRequest = createPolicyRequest(maximumCover, 2500);

    await expect(contract.buyPolicy(policyRequest)).to.be.revertedWith(
      "Duration exceeds maximum"
    );
  });

  it("Reject request with min loss less than threshold", async function () {
    const minLossProtection = await contract.minLossProtectionInBps();
    const policyRequest = createPolicyRequest(10000, minLossProtection - 1);

    await expect(contract.buyPolicy(policyRequest)).to.be.revertedWith(
      "Protection lower than minimum"
    );
  });

  it("Reject request with min loss above 100%", async function () {
    const policyRequest = createPolicyRequest(10000, 100001);

    await expect(contract.buyPolicy(policyRequest)).to.be.revertedWith(
      "Protection greater than 100%"
    );
  });

  it("Request price if policy request is valid", async function () {
    const policyRequest = createPolicyRequest();
    const premium = await contract.calculatePremium(policyRequest);
    await mockDai.approve(contract.address, premium);
    const priceRequestId = utils.formatBytes32String("hello");
    await mockTreasury.mock.depositPremium.returns();
    await mockTreasury.mock.earmarkFunds.returns();
    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.buyPolicy(policyRequest);
    expect("requestPrice").to.be.calledOnContractWith(mockPriceProducer, [
      policyRequest.externalCode,
    ]);
    expect(await mockDai.balanceOf(mockTreasury.address)).to.be.equal(premium);
  });

  it("Only price producer can call price function callback", async function () {
    const premium = 1;
    await mockDai.approve(contract.address, premium);
    const priceRequestId = utils.formatBytes32String("hello");
    const policyRequest = createPolicyRequest();
    await mockTreasury.mock.depositPremium.returns();
    await mockTreasury.mock.earmarkFunds.returns();
    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);

    await contract.buyPolicy(policyRequest);
    await expect(contract.onPriceResponse(priceRequestId, 100)).to.be.reverted;
  });

  it("Creates policy on price callback", async function () {
    const premium = 1;
    await mockDai.approve(contract.address, premium);
    const minimumPrice = await contract.minimumPrice();
    const priceRequestId = utils.formatBytes32String("hello");
    const policyRequest = createPolicyRequest();
    const policyId = 123;

    await mockTreasury.mock.depositPremium.returns();
    await mockTreasury.mock.earmarkFunds.returns();
    await mockPolicy.mock.mintPolicy.returns(policyId);
    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);

    await contract.buyPolicy(policyRequest);
    await expect(
      callRawMock(
        mockPriceProducer,
        contract,
        "onPriceResponse(bytes32,uint256)",
        priceRequestId,
        minimumPrice + 1
      )
    )
      .to.emit(contract, "PolicyUnderwritten")
      .withArgs(
        userWallet.address,
        policyId,
        (await getCurrentTimeStamp()) + policyRequest.durationInS
      );

    expect("mintPolicy").to.be.calledOnContract(mockPolicy);
    expect("earmarkFunds").to.be.calledOnContractWith(mockTreasury, [
      policyRequest.coverAmount,
    ]);
  });

  it("Policy cannot be underwritten if funds not available", async function () {
    const policyRequest = createPolicyRequest();
    const premium = await contract.calculatePremium(policyRequest);
    await mockDai.approve(contract.address, premium);
    const minumumPrice = await contract.minimumPrice();
    const priceRequestId = utils.formatBytes32String("hello");
    await mockTreasury.mock.earmarkFunds.returns();
    await mockTreasury.mock.depositPremium.returns();
    await mockTreasury.mock.payoutEarmarked.returns();

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.buyPolicy(policyRequest);
    await mockTreasury.mock.earmarkFunds.reverts();
    await callRawMock(
      mockPriceProducer,
      contract,
      "onPriceResponse(bytes32,uint256)",
      priceRequestId,
      minumumPrice + 1
    );

    expect("payoutEarmarked").to.be.calledOnContractWith(mockTreasury, [
      premium,
      userWallet.address,
    ]);
  });
  it("Policy cannot be underwritten if price below minimum", async function () {
    const policyRequest = createPolicyRequest();
    const premium = await contract.calculatePremium(policyRequest);
    await mockDai.approve(contract.address, premium);
    const minumumPrice = await contract.minimumPrice();
    const priceRequestId = utils.formatBytes32String("hello");
    await mockTreasury.mock.earmarkFunds.returns();
    await mockTreasury.mock.depositPremium.returns();
    await mockTreasury.mock.payoutEarmarked.returns();

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.buyPolicy(policyRequest);
    await callRawMock(
      mockPriceProducer,
      contract,
      "onPriceResponse(bytes32,uint256)",
      priceRequestId,
      minumumPrice - 1
    );

    expect("payoutEarmarked").to.be.calledOnContractWith(mockTreasury, [
      premium,
      userWallet.address,
    ]);
  });
});

function createPolicyRequest(
  _durationInS = 10000,
  _minLossInBps = 2500,
  _coverAmount = utils.parseEther("1.0")
) {
  return {
    coverAmount: _coverAmount,
    durationInS: _durationInS,
    externalCode: "A12",
    minLossInBps: _minLossInBps,
  };
}
