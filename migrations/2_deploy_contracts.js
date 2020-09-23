var ControllablePriceFetcher = artifacts.require(
  "./mocks/ControllablePriceFetcher.sol"
);
var PriceFetcher = artifacts.require("./PriceFetcher.sol");
var Treasury = artifacts.require("./Treasury.sol");
var Policy = artifacts.require("./Policy.sol");
var Underwriter = artifacts.require("./Underwriter.sol");

module.exports = async function (deployer) {
  const priceFetcher = await deployer.deploy(PriceFetcher);
  const treasury = await deployer.deploy(Treasury);
  const controllablePriceFetcher = await deployer.deploy(
    ControllablePriceFetcher
  );
  const policy = await deployer.deploy(
    Policy,
    treasury.address,
    controllablePriceFetcher.address
  );
  const underwriter = await deployer.deploy(
    Underwriter,
    treasury.address,
    controllablePriceFetcher.address,
    policy.address
  );
  await treasury.addTreasurer(policy.address);
  await policy.transferOwnership(underwriter.address);
};
