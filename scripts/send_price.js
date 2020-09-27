const Web3 = require("web3");

var ControllablePriceFetcher = artifacts.require(
  "./mocks/ControllablePriceFetcher.sol"
);

// Utils
const ether = (n) => {
  return new web3.utils.BN(web3.utils.toWei(n.toString(), "ether"));
};

module.exports = async function (callback) {
  try {
    const controllablePriceFetcher = await ControllablePriceFetcher.deployed();
    let counter = await controllablePriceFetcher.counter();
    let requestId = web3.eth.abi.encodeParameter("uint256", String(counter));
    await controllablePriceFetcher.onPriceResponse(requestId, 1000000);
  } catch (error) {
    console.log(error);
  }

  callback();
};
