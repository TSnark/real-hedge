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
const Underwriter = require("../build/Underwriter.json");
const rawMockAbi = [
  " function __waffle__call(address target, bytes calldata data) external returns (bytes memory)",
];

use(solidity);

describe("Underwriter", function () {
  let mockPriceProducer;
  let mockPriceProducerRaw;
  let mockTreasury;
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

    contract = await deployContract(deployerWallet, Underwriter, [
      mockTreasury.address,
      mockPriceProducer.address,
      mockPolicy.address,
    ]);
  });

  it("Reject quotes with amount above maximum", async function () {
    const maximumCover = await contract.maxCoverAmountInWei();
    const quoteRequest = createQuoteRequest(10000, 2500, maximumCover);

    await expect(contract.createQuote(quoteRequest)).to.be.revertedWith(
      "Amount exceeds maximum"
    );
  });

  it("Reject quotes with amount 0", async function () {
    const quoteRequest = createQuoteRequest(10000, 2500, 0);

    await expect(contract.createQuote(quoteRequest)).to.be.revertedWith(
      "Amount must be positive"
    );
  });

  it("Reject quotes with duration 0", async function () {
    const quoteRequest = createQuoteRequest(0, 2500);

    await expect(contract.createQuote(quoteRequest)).to.be.revertedWith(
      "Duration must be positive"
    );
  });

  it("Reject quotes with duration above maximum", async function () {
    const maximumCover = await contract.maxPolicyDurationInS();

    const quoteRequest = createQuoteRequest(maximumCover, 2500);

    await expect(contract.createQuote(quoteRequest)).to.be.revertedWith(
      "Duration exceeds maximum"
    );
  });

  it("Reject quotes with min loss less than threshold", async function () {
    const minLossProtection = await contract.minLossProtectionInBps();
    const quoteRequest = createQuoteRequest(10000, minLossProtection - 1);

    await expect(contract.createQuote(quoteRequest)).to.be.revertedWith(
      "Protection lower than minimum"
    );
  });

  it("Reject quotes with min loss above 100%", async function () {
    const quoteRequest = createQuoteRequest(10000, 100001);

    await expect(contract.createQuote(quoteRequest)).to.be.revertedWith(
      "Protection greater than 100%"
    );
  });

  it("Request price if quote request is valid", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    const quoteRequest = createQuoteRequest();

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.createQuote(quoteRequest);
    expect("requestPrice").to.be.calledOnContractWith(mockPriceProducer, [
      quoteRequest.externalCode,
    ]);
  });

  it("Creates quote on price callback", async function () {
    const maxQuoteValidityInS = (
      await contract.maxQuoteValidityInS()
    ).toNumber();
    const priceRequestId = utils.formatBytes32String("hello");
    const quoteRequest = createQuoteRequest();

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.createQuote(quoteRequest);
    await expect(
      callRawMock(
        mockPriceProducer,
        contract,
        "onPriceResponse(bytes32,uint256)",
        priceRequestId,
        10000
      )
    )
      .to.emit(contract, "QuoteCreated")
      .withArgs(
        deployerWallet.address,
        priceRequestId,
        1,
        (await getCurrentTimeStamp()) + maxQuoteValidityInS
      );
  });

  it("Only price producer can call price function callback", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    const quoteRequest = createQuoteRequest();

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.createQuote(quoteRequest);
    await expect(contract.onPriceResponse(priceRequestId, 100)).to.be.reverted;
  });

  it("Policy cannot be underwritten if funds not available", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    const quoteRequest = createQuoteRequest();
    await mockTreasury.mock.isCapitalAvailable.returns(false);

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.createQuote(quoteRequest);
    await callRawMock(
      mockPriceProducer,
      contract,
      "onPriceResponse(bytes32,uint256)",
      priceRequestId,
      10000
    );
    await expect(contract.underwritePolicy(priceRequestId)).to.be.revertedWith(
      "Insufficient funds"
    );
  });

  it("Policy cannot be underwritten if premium not fully paid", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    const quoteRequest = createQuoteRequest();
    await mockTreasury.mock.isCapitalAvailable.returns(true);

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.createQuote(quoteRequest);
    await callRawMock(
      mockPriceProducer,
      contract,
      "onPriceResponse(bytes32,uint256)",
      priceRequestId,
      10000
    );
    await expect(contract.underwritePolicy(priceRequestId)).to.be.revertedWith(
      "Premium not fully paid"
    );
  });

  it("Policy can be bought only by quote requester", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    const quoteRequest = createQuoteRequest();
    await mockTreasury.mock.isCapitalAvailable.returns(true);

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.createQuote(quoteRequest);
    await callRawMock(
      mockPriceProducer,
      contract,
      "onPriceResponse(bytes32,uint256)",
      priceRequestId,
      10000
    );
    const contractCalledByUser = contract.connect(userWallet);
    await expect(
      contractCalledByUser.underwritePolicy(priceRequestId, {value: 10})
    ).to.be.revertedWith("Only requester can buy policy");
  });

  it("Underwrite policy correctly", async function () {
    const priceRequestId = utils.formatBytes32String("hello");
    const quoteRequest = createQuoteRequest();
    await mockTreasury.mock.isCapitalAvailable.returns(true);
    await mockTreasury.mock.depositPremium.returns();
    await mockPolicy.mock.mintPolicy.returns(123);

    await mockPriceProducer.mock.requestPrice.returns(priceRequestId);
    await contract.createQuote(quoteRequest);
    await callRawMock(
      mockPriceProducer,
      contract,
      "onPriceResponse(bytes32,uint256)",
      priceRequestId,
      10000
    );
    await expect(
      contract.underwritePolicy(priceRequestId, {value: 10})
    ).to.emit(contract, "PolicyUnderwritten");
  });
});

function createQuoteRequest(
  _durationInS = 10000,
  _minLossInBps = 2500,
  _coverAmountInWei = utils.parseEther("1.0")
) {
  return {
    coverAmountInWei: _coverAmountInWei,
    durationInS: _durationInS,
    externalCode: "A12",
    minLossInBps: _minLossInBps,
  };
}
