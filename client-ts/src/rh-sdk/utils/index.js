import BigNumber from "bignumber.js";
import Web3 from "web3";

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
});

const GAS_LIMIT = {
  DEFAULT: 2000000,
};

export const buyPolicy = async (
  rh,
  account,
  {amount, durationInMonths, location},
  onTxHash
) => {
  const underwriterContract = rh.contracts.underwriter;
  const gas = GAS_LIMIT.DEFAULT;
  return underwriterContract.methods
    .buyPolicy({
      durationInS: durationInMonths * 30 * 24 * 60 * 60,
      externalCode: location,
      coverAmount: new BigNumber(amount)
        .times(new BigNumber(10).pow(18))
        .toString(),
      minLossInBps: 2500,
    })
    .send({from: account, gas}, async (error, txHash) => {
      if (error) {
        onTxHash && onTxHash();
        console.log("Policy creation error", error);
        return false;
      }
      const status = await waitTransaction(rh.web3.eth, txHash);
      onTxHash && onTxHash(txHash);
      if (!status) {
        console.log("Policy creation transaction failed.");
        return false;
      }
      return true;
    });
};

export const claim = async (rh, account, policyId, onTxHash) => {
  const underwriterContract = rh.contracts.policy;
  const gas = GAS_LIMIT.DEFAULT;
  return underwriterContract.methods
    .claim(policyId)
    .send({from: account, gas}, async (error, txHash) => {
      if (error) {
        onTxHash && onTxHash();
        console.log("Policy claim error", error);
        return false;
      }
      const status = await waitTransaction(rh.web3.eth, txHash);
      onTxHash && onTxHash(txHash);
      if (!status) {
        console.log("Policy claim transaction failed.");
        return false;
      }
      return true;
    });
};

export const getAllPolicies = async (rh, account) => {
  const policyContract = rh.contracts.policy;
  const balance = await policyContract.methods.balanceOf(account).call();
  let policies = [];
  for (let i = 0; i < balance; i++) {
    const policyId = await policyContract.methods
      .tokenOfOwnerByIndex(account, i)
      .call();
    const policy = await policyContract.methods.policies(policyId).call();
    console.log(policy);
    policy.coverAmount = new BigNumber(policy.coverAmount);
    policies.push(policy);
  }
  return policies;
};

const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const waitTransaction = async (provider, txHash) => {
  const web3 = new Web3(provider);
  let txReceipt = null;
  while (txReceipt === null) {
    const r = await web3.eth.getTransactionReceipt(txHash);
    txReceipt = r;
    await sleep(2000);
  }
  return txReceipt.status;
};

export const waitForPolicy = (rh, address, onPolicy) => {
  const underwriterContract = rh.contracts.underwriter;
  underwriterContract.once(
    "PolicyUnderwritten",
    {
      filter: {holder: address},
      fromBlock: 0,
    },
    function (error, event) {
      onPolicy();
      console.log(event);
    }
  );
  underwriterContract.once(
    "PremiumRefunded",
    {
      filter: {holder: address},
      fromBlock: 0,
    },
    function (error, event) {
      onPolicy();
      console.log(event);
    }
  );
};

export const deposit = async (rh, amount, account, onTxHash) => {
  const poolContract = rh.contracts.rDai;
  const gas = GAS_LIMIT.DEFAULT;
  return poolContract.methods
    .deposit(new BigNumber(amount).times(new BigNumber(10).pow(18)).toString())
    .send({from: account, gas}, async (error, txHash) => {
      if (error) {
        onTxHash && onTxHash("");
        console.log("Deposit error", error);
        return false;
      }
      onTxHash && onTxHash(txHash);
      const status = await waitTransaction(rh.web3.eth, txHash);
      if (!status) {
        console.log("Deposit transaction failed.");
        return false;
      }
      return true;
    });
};

export const withdraw = async (rh, amount, account, onTxHash) => {
  const poolContract = rh.contracts.rDai;
  return poolContract.methods
    .withdraw(new BigNumber(amount).times(new BigNumber(10).pow(18)).toString())
    .send({from: account, gas: 200000}, async (error, txHash) => {
      if (error) {
        onTxHash && onTxHash("");
        console.log("Withdrawal error", error);
        return false;
      }
      onTxHash && onTxHash(txHash);
      const status = await waitTransaction(rh.web3.eth, txHash);
      if (!status) {
        console.log("Withdraw transaction failed.");
        return false;
      }
      return true;
    });
};

export const getValue = async (rh, pool, account) => {
  try {
    const pricePerShare = new BigNumber(
      await rh.contracts.rDai.methods.getPricePerFullShare().call()
    );
    const shares = new BigNumber(await pool.methods.balanceOf(account).call());
    return shares
      .multipliedBy(pricePerShare)
      .dividedBy(new BigNumber(10).pow(18));
  } catch (e) {
    console.log(e);
  }
  return new BigNumber(0);
};

export const getShares = async (rh, pool, account) => {
  return rh.toBigN(await pool.methods.balanceOf(account).call());
};
