const path = require("path");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  compilers: {
    solc: {
      version: "0.6.12",
    },
  },
  // contracts_build_directory: path.join(__dirname, "client/src/contracts"),
  networks: {
    local: {
      host: "127.0.0.1",
      network_id: 5777,
      port: 8545,
    },
  },
};
