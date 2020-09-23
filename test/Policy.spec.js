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
const Policy = require("../build/Policy.json");
const rawMockAbi = [
  " function __waffle__call(address target, bytes calldata data) external returns (bytes memory)",
];

use(solidity);

describe("Policy", function () {
  let mockPriceProducer;
  let mockPriceProducerRaw;

  let mockTreasury;
  let contract;

  // const provider = waffle.provider;
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

    contract = await deployContract(deployerWallet, Policy, [
      mockTreasury.address,
      mockPriceProducer.address,
    ]);
  });

  it("Owner can mint a policy for a user", async function () {
    const expectedTokenId = 0;
    const policyData = createPolicyData();

    await expect(contract.mintPolicy(userWallet.address, policyData))
      // Verification of triggered events
      .to.emit(contract, "Transfer")
      .withArgs(
        "0x0000000000000000000000000000000000000000",
        userWallet.address,
        expectedTokenId
      );

    expect(await contract.balanceOf(userWallet.address)).to.equal(1);
    expect(await contract.ownerOf(expectedTokenId)).to.equal(
      userWallet.address
    );
  });

  it("Non owner cannot mint a policy", async function () {
    const policyData = createPolicyData();

    const contractCalledByUser = contract.connect(userWallet);
    await expect(
      contractCalledByUser.mintPolicy(userWallet.address, policyData)
    ).to.be.reverted;
  });

  it("Claim calls price producer if policy still valid", async function () {
    await mockPriceProducer.mock.requestPrice.returns(utils.randomBytes(32));
    const expiry = (await getCurrentTimeStamp()) + 10000; //Make sure policy is not elapsed
    const policyData = createPolicyData(expiry);

    const tokenId = (await contract.mintPolicy(userWallet.address, policyData))
      .value;

    await contract.claim(tokenId);

    expect("requestPrice").to.be.calledOnContractWith(mockPriceProducer, [
      policyData.externalCode,
    ]);
  });

  it("Price producer callback results in payout when price below strike price", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await mockTreasury.mock.payout.returns();
    const expiry = (await getCurrentTimeStamp()) + 10000; //Make sure policy is not elapsed
    const policyData = createPolicyData(expiry);

    const tokenId = (await contract.mintPolicy(userWallet.address, policyData))
      .value;

    await contract.claim(tokenId);
    await callRawMock(
      mockPriceProducer,
      contract,
      "onPriceResponse(bytes32,uint256)",
      priceRequestId,
      policyData.strikePrice - 1
    );

    expect("payout").to.be.calledOnContractWith(mockTreasury, [
      policyData.coverAmountInWei,
      userWallet.address,
    ]);

    expect(await contract.balanceOf(userWallet.address)).to.equal(0);
  });

  it("Price producer callback results in noop when price above strike price", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    const expiry = (await getCurrentTimeStamp()) + 10000; //Make sure policy is not elapsed
    const policyData = createPolicyData(expiry);

    const tokenId = (await contract.mintPolicy(userWallet.address, policyData))
      .value;

    await contract.claim(tokenId);
    await callRawMock(
      mockPriceProducer,
      contract,
      "onPriceResponse(bytes32,uint256)",
      priceRequestId,
      policyData.strikePrice + 1
    );

    expect(await contract.balanceOf(userWallet.address)).to.equal(1);
  });

  it("Only price producer can call price function callback", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    const expiry = (await getCurrentTimeStamp()) + 10000; //Make sure policy is not elapsed
    const policyData = createPolicyData(expiry);

    const tokenId = (await contract.mintPolicy(userWallet.address, policyData))
      .value;

    await contract.claim(tokenId);
    await expect(contract.onPriceResponse(priceRequestId, 100)).to.be.reverted;
  });

  it("Claim burns policy if elapsed", async function () {
    const policyData = createPolicyData(1);

    const tokenId = (await contract.mintPolicy(userWallet.address, policyData))
      .value;

    await contract.claim(tokenId);

    expect(await contract.balanceOf(userWallet.address)).to.equal(0);
  });
});

function createPolicyData(expiry = 10000) {
  return {
    coverAmountInWei: 1000,
    end: expiry,
    externalCode: "A12",
    strikePrice: 100000,
    active: true,
  };
}
