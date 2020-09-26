const {use, expect} = require("chai");
const {utils, Contract, ContractFactory} = require("ethers");
const {
  deployMockContract,
  MockProvider,
  solidity,
  deployContract,
} = require("ethereum-waffle");
const Treasury = require("../build/Treasury.json");
const MockDAI = require("../build/MockDAI.json");

use(solidity);

describe("Treasury", function () {
  let contract;
  let mockDai;

  const provider = new MockProvider();
  const [deployerWallet, treasurerWallet, otherWallet] = provider.getWallets();

  const setContractBalance = async (balance) => {
    await mockDai.transfer(contract.address, utils.parseEther(balance));
  };

  beforeEach(async () => {
    mockDai = await deployContract(deployerWallet, MockDAI);
    contract = await deployContract(deployerWallet, Treasury, [
      mockDai.address,
    ]);

    await contract.addTreasurer(treasurerWallet.address);
  });

  it("Capital available when balance positive, no earmarked funds and amount < balance", async function () {
    await setContractBalance("1");
    expect(await contract.isCapitalAvailable(100)).to.be.true;
  });

  it("Capital not available when balance positive, no earmarked funds and amount > balance", async function () {
    await setContractBalance("1");
    expect(await contract.isCapitalAvailable(utils.parseEther("2"))).to.be
      .false;
  });

  it("Capital available when balance positive, earmarked funds + amount < balance", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    const earmarked = 1000;
    await contractCalledByTreasurer.earmarkFunds(earmarked);
    expect(await contract.isCapitalAvailable(100)).to.be.true;
    expect(await contract.totalEarmarkedFunds()).to.equal(earmarked);
  });

  it("Capital not available when balance positive, earmarked funds + amount > balance", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    await contractCalledByTreasurer.earmarkFunds(utils.parseEther("1"));
    expect(await contract.isCapitalAvailable(1)).to.be.false;
  });

  it("Cannot earmark more than available capital", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    await expect(
      contractCalledByTreasurer.earmarkFunds(utils.parseEther("1.1"))
    ).to.be.revertedWith("Insufficient Funds");
  });

  it("Payout fails if capital not available", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    const earmarked = utils.parseEther("0.1");
    await contractCalledByTreasurer.earmarkFunds(earmarked);
    await expect(
      contractCalledByTreasurer.payout(
        utils.parseEther("1"),
        treasurerWallet.address
      )
    ).to.be.revertedWith("Insufficient Funds");
    expect(await contract.totalEarmarkedFunds()).to.equal(earmarked);
  });

  it("Payout succeeds", async function () {
    const initialRecipientBalance = await mockDai.balanceOf(
      otherWallet.address
    );
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    const earmarked = utils.parseEther("0.1");
    await contractCalledByTreasurer.earmarkFunds(earmarked);
    const payoutAmount = 10;
    await contractCalledByTreasurer.payout(payoutAmount, otherWallet.address);
    expect(await mockDai.balanceOf(otherWallet.address)).to.equal(
      initialRecipientBalance.add(payoutAmount)
    );
    expect(await contract.totalEarmarkedFunds()).to.equal(earmarked);
  });

  it("Payout earmarked fails if capital not available", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    await contractCalledByTreasurer.earmarkFunds(utils.parseEther("0.1"));
    await expect(
      contractCalledByTreasurer.payoutEarmarked(
        utils.parseEther("1"),
        treasurerWallet.address
      )
    ).to.be.revertedWith("Cannot release more than earmarked");
  });

  it("Payout earmarked succeeds", async function () {
    const initialRecipientBalance = await mockDai.balanceOf(
      otherWallet.address
    );
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    const earmarkedFunds = 1000;
    await contractCalledByTreasurer.earmarkFunds(earmarkedFunds);
    const payoutAmount = 10;
    await contractCalledByTreasurer.payoutEarmarked(
      payoutAmount,
      otherWallet.address
    );
    expect(await mockDai.balanceOf(otherWallet.address)).to.equal(
      initialRecipientBalance.add(payoutAmount)
    );
    expect(await contract.totalEarmarkedFunds()).to.equal(
      earmarkedFunds - payoutAmount
    );
  });

  it("Only treasurer can earmark funds", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    await expect(
      contract.releaseFunds(utils.parseEther("0.1"))
    ).to.be.revertedWith("Access Denied");
  });

  it("Release funds", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    const earmarked = 1000;
    const released = 500;
    await contractCalledByTreasurer.earmarkFunds(earmarked);
    expect(await contract.totalEarmarkedFunds()).to.equal(earmarked);
    await contractCalledByTreasurer.releaseFunds(released);
    expect(await contract.totalEarmarkedFunds()).to.equal(earmarked - released);
  });

  it("Cannot release more funds than earmarked", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    const released = 500;
    await expect(
      contractCalledByTreasurer.releaseFunds(released)
    ).to.be.revertedWith("Cannot release more than earmarked");
  });

  it("Only treasurer can release funds", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    await expect(
      contract.earmarkFunds(utils.parseEther("0.1"))
    ).to.be.revertedWith("Access Denied");
  });

  it("Only treasurer can pay out earmarked", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    await contractCalledByTreasurer.earmarkFunds(utils.parseEther("0.1"));
    await expect(
      contract.payoutEarmarked(utils.parseEther("1"), treasurerWallet.address)
    ).to.be.revertedWith("Access Denied");
  });

  it("Only treasurer can payout", async function () {
    const contractCalledByTreasurer = contract.connect(treasurerWallet);
    await setContractBalance("1");
    await contractCalledByTreasurer.earmarkFunds(utils.parseEther("0.1"));
    await expect(
      contract.payout(utils.parseEther("1"), treasurerWallet.address)
    ).to.be.revertedWith("Access Denied");
  });
});
