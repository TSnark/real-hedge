const {use, expect} = require("chai");
const {utils, Contract, ContractFactory} = require("ethers");
const {
  deployMockContract,
  MockProvider,
  solidity,
  deployContract,
} = require("ethereum-waffle");
const Treasury = require("../build/AaveTreasury.json");
const MockDAI = require("../build/MockDAI.json");
const IAave = require("../build/IAave.json");
const IAaveToken = require("../build/IAaveToken.json");
const ILendingPoolAddressesProvider = require("../build/ILendingPoolAddressesProvider.json");

use(solidity);

describe("AaveTreasury", function () {
  let contract;
  let mockDai;
  let mockAave;
  let mockAaveToken;
  let mockAddressProvider;

  const provider = new MockProvider();
  const [deployerWallet, treasurerWallet, otherWallet] = provider.getWallets();

  const setContractBalance = async (balance) => {
    await mockDai.transfer(contract.address, utils.parseEther(balance));
  };

  beforeEach(async () => {
    mockDai = await deployContract(deployerWallet, MockDAI);
    mockAave = await deployMockContract(deployerWallet, IAave.abi);
    mockAaveToken = await deployMockContract(deployerWallet, IAaveToken.abi);
    mockAddressProvider = await deployMockContract(
      deployerWallet,
      ILendingPoolAddressesProvider.abi
    );
    contract = await deployContract(deployerWallet, Treasury, [
      mockDai.address,
      mockAaveToken.address,
      mockAddressProvider.address,
    ]);

    await mockAave.mock.deposit.returns();
    await mockAddressProvider.mock.getLendingPool.returns(mockAave.address);
    await mockAddressProvider.mock.getLendingPoolCore.returns(mockAave.address); //Any address is ok
    await mockAaveToken.mock.balanceOf.returns(utils.parseEther("0"));

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

  it("Deposit succeeds", async function () {
    expect(await mockDai.balanceOf(contract.address)).to.equal(0);
    const amount = 100;
    await mockDai.approve(contract.address, amount);
    await contract.deposit(amount, deployerWallet.address);
    expect(await mockDai.balanceOf(contract.address)).to.equal(amount);
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

  //Aave Tests
  it("Deposit transfer 90 amount to Aave when total balance is 0", async function () {
    expect(await mockDai.balanceOf(contract.address)).to.equal(0);
    const amount = utils.parseEther("10000");
    await mockDai.approve(contract.address, amount);
    await contract.deposit(amount, deployerWallet.address);
    expect(await mockDai.balanceOf(contract.address)).to.equal(
      utils.parseEther("1000")
    );
    expect("deposit").to.be.calledOnContractWith(mockAave, [
      mockDai.address,
      utils.parseEther("9000"),
      0,
    ]);
  });

  it("Deposit transfers 90% amount to Aave when total balance is 0", async function () {
    expect(await mockDai.balanceOf(contract.address)).to.equal(0);
    const amount = utils.parseEther("10000");
    await mockDai.approve(contract.address, amount);
    await contract.deposit(amount, deployerWallet.address);
    expect(await mockDai.balanceOf(contract.address)).to.equal(
      utils.parseEther("1000")
    );
    expect("deposit").to.be.calledOnContractWith(mockAave, [
      mockDai.address,
      utils.parseEther("9000"),
      0,
    ]);
  });

  it("Deposit transfers 90% amount to Aave when investment under target", async function () {
    await setContractBalance("100000");
    const amount = utils.parseEther("10000");
    await mockDai.approve(contract.address, amount);
    await contract.deposit(amount, deployerWallet.address);
    expect(await mockDai.balanceOf(contract.address)).to.equal(
      utils.parseEther("101000") //Balance + new amount
    );
    expect("deposit").to.be.calledOnContractWith(mockAave, [
      mockDai.address,
      utils.parseEther("9000"),
      0,
    ]);
  });

  it("Deposit transfers 100% amount to reserves when investment above target", async function () {
    await setContractBalance("1000");
    await mockAaveToken.mock.balanceOf.returns(utils.parseEther("100000"));
    const amount = utils.parseEther("10000");
    await mockDai.approve(contract.address, amount);
    await contract.deposit(amount, deployerWallet.address);
    expect(await mockDai.balanceOf(contract.address)).to.equal(
      utils.parseEther("11000") //Balance + new amount
    );
  });

  // TODO Conver mock aave token to real contract
  //it("Payout divests when reserves not enough", async function () {
  //   const payoutAmount = utils.parseEther("10000");
  //   await setContractBalance("1000");
  //   await mockAaveToken.mock.balanceOf.returns(utils.parseEther("100000"));
  //   await mockAaveToken.mock.redeem.returns();

  //   const contractCalledByTreasurer = contract.connect(treasurerWallet);

  //   await contractCalledByTreasurer.payout(payoutAmount, otherWallet.address);

  //   expect(await mockDai.balanceOf(otherWallet.address)).to.equal(payoutAmount);
  //   expect("redeem").to.be.calledOnContractWith(mockAaveToken, [
  //     mockDai.address,
  //     amount,
  //     0,
  //   ]);
  // });
});
