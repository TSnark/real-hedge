var ControllablePriceFetcher = artifacts.require(
  "./mocks/ControllablePriceFetcher.sol"
);
var PriceFetcher = artifacts.require("./PriceFetcher.sol");
var DateHelper = artifacts.require("./DateHelper.sol");
var Treasury = artifacts.require("./Treasury.sol");
var AaveTreasury = artifacts.require("./AaveTreasury.sol");
var Policy = artifacts.require("./Policy.sol");
var Underwriter = artifacts.require("./Underwriter.sol");
var MockDai = artifacts.require("./mocks/MockDAI.sol");
var RDai = artifacts.require("./mocks/RDAI.sol");
const constants = require("./constants.js");

module.exports = async function (deployer, network) {
  let dateHelper = await deployer.deploy(DateHelper); //Workaround for truffle bug

  network = network.replace("-fork", "");
  let daiAddress;
  let priceFetcher;
  let treasury;
  if (isLocal(network)) {
    let mockDai = await deployer.deploy(MockDai);
    daiAddress = mockDai.address;
    const controllablePriceFetcher = await deployer.deploy(
      ControllablePriceFetcher
    );
    priceFetcher = controllablePriceFetcher;
    treasury = await deployer.deploy(Treasury, daiAddress);
  } else {
    daiAddress = constants[network].dai;
    dateHelper = await deployer.deploy(DateHelper);
    const chainlinkPriceFetcher = await deployer.deploy(
      PriceFetcher,
      constants[network].link,
      constants[network].httpOracle,
      web3.utils.fromAscii(constants[network].httpGetJobId),
      link(0.1),
      dateHelper.address
    );
    priceFetcher = chainlinkPriceFetcher;
    treasury = await deployer.deploy(
      AaveTreasury,
      daiAddress,
      constants[network].aaveToken,
      constants[network].aaveAddressesProvider
    );
  }

  const rDai = await deployer.deploy(RDai, daiAddress, treasury.address);
  const policy = await deployer.deploy(
    Policy,
    treasury.address,
    priceFetcher.address
  );
  const underwriter = await deployer.deploy(
    Underwriter,
    treasury.address,
    priceFetcher.address,
    policy.address,
    daiAddress
  );

  // Setup ACL
  await treasury.addTreasurer(policy.address);
  await treasury.addTreasurer(underwriter.address);
  await treasury.addTreasurer(rDai.address);
  await priceFetcher.addUser(policy.address);
  await priceFetcher.addUser(underwriter.address);
  await policy.transferOwnership(underwriter.address);
  console.log(daiAddress);
};

const link = (n) => {
  return new web3.utils.BN(web3.utils.toWei(n.toString(), "ether"));
};
function isLocal(network) {
  return network === "local" || network === "teams";
}
