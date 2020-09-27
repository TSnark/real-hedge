export class Account {
  constructor(contracts, address) {
    this.contracts = contracts;
    this.accountInfo = address;
    this.type = "";
    this.allocation = [];
    this.balances = {};
    this.status = "";
    this.approvals = {};
    this.walletInfo = {};
  }

  async getDAIWalletBalance() {
    this.walletInfo["DAI"] = await this.contracts.dai.methods
      .balanceOf(this.accountInfo)
      .call();
    return this.walletInfo["DAI"];
  }

  async getRDAIVWalletBalance() {
    this.walletInfo["rDAI"] = await this.contracts.rDai.methods
      .balanceOf(this.accountInfo)
      .call();
    return this.walletInfo["rDAI"];
  }
}
