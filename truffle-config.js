const path = require("path");
const HDWalletProvider = require("@truffle/hdwallet-provider");
const keys = require("./private.js");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  compilers: {
    solc: {
      version: "0.6.12",
    },
  },
  contracts_build_directory: path.join(
    __dirname,
    "client-ts/src/rh-sdk/lib/clean_build/contracts"
  ),
  networks: {
    local: {
      host: "127.0.0.1",
      network_id: 1337,
      port: 8545,
    },
    kovan: {
      provider: () =>
        new HDWalletProvider(
          keys.kovanPrivateKey,
          "https://kovan.infura.io/v3/34551d538c09417bab045d7ae2b20a83"
        ),
      network_id: 42,
      gas: 4700000,
    },
    mainnet: {
      network_id: 1,
    },
  },
};
