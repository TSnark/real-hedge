// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ITreasury.sol";

contract RDAI is ERC20Burnable {
    using SafeERC20 for IERC20;
    using Address for address;
    using SafeMath for uint256;

    ITreasury private _treasury;
    IERC20 private _dai;

    uint256 public pool;

    constructor(IERC20 dai, ITreasury treasury)
        public
        ERC20("Real Hedge DAI", "rDAI")
    {
        _treasury = treasury;
        _dai = dai;
        _dai.safeApprove(address(_treasury), uint256(-1));
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "Deposit must be greater than 0");
        uint256 value = _treasury.totalBalance();

        _treasury.deposit(amount, msg.sender);

        uint256 shares = 0;
        if (value == 0) {
            shares = amount;
            value = amount.add(value);
        } else {
            shares = (amount.mul(totalSupply())).div(value);
        }
        _mint(msg.sender, shares);
    }

    function withdraw(uint256 shares) external {
        require(shares > 0, "Withdraw must be greater than 0");

        uint256 ibalance = balanceOf(msg.sender);
        require(shares <= ibalance, "Insufficient balance");

        uint256 value = _treasury.totalBalance();
        uint256 amount = (value.mul(shares)).div(totalSupply());
        _burn(msg.sender, shares);

        // This reverts if capital not available
        _treasury.payout(amount, msg.sender);
    }

    function getPricePerFullShare() public view returns (uint256) {
        uint256 value = _treasury.totalBalance();
        return value.mul(1e18).div(totalSupply());
    }
}
