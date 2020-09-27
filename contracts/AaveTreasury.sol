// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./Treasury.sol";
import "./interfaces/IAave.sol";
import "./interfaces/IAaveToken.sol";
import "./interfaces/ILendingPoolAddressesProvider.sol";

contract AaveTreasury is Treasury {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IAaveToken private _aaveToken;
    ILendingPoolAddressesProvider private _aaveAddressProvider;

    uint256 private constant _TARGET_RESERVES_IN_BPS = 1000;
    uint256 private constant _100_PCT_IN_BPS = 10000;
    uint256 private constant _INVESTMENT_TRIGGER_AMOUNT = 1000 * 1e18; //1000 DAI

    constructor(
        IERC20 dai,
        IAaveToken aaveToken,
        ILendingPoolAddressesProvider aaveAddressProvider
    ) public Treasury(dai) {
        _aaveAddressProvider = aaveAddressProvider;
        _aaveToken = aaveToken;
    }

    function deposit(uint256 amount, address payee) external override {
        _dai.safeTransferFrom(payee, address(this), amount); //This is not optimal
        if (_shouldInvest(amount)) {
            uint256 reserves = amount.mul(_TARGET_RESERVES_IN_BPS).div(
                _100_PCT_IN_BPS
            );
            uint256 investment = amount.sub(reserves);
            _dai.safeApprove(
                _aaveAddressProvider.getLendingPoolCore(),
                investment
            );
            IAave(_aaveAddressProvider.getLendingPool()).deposit(
                address(_dai),
                investment,
                0
            );
        }
    }

    function _shouldInvest(uint256 amount) private view returns (bool) {
        return
            amount > _INVESTMENT_TRIGGER_AMOUNT &&
            (totalBalance() == 0 ||
                reservesBalance().mul(_100_PCT_IN_BPS).div(totalBalance()) >
                _TARGET_RESERVES_IN_BPS);
    }

    function totalBalance() public override view returns (uint256) {
        return reservesBalance().add(investmentsBalance());
    }

    function reservesBalance() public view returns (uint256) {
        return _dai.balanceOf(address(this));
    }

    function investmentsBalance() public view returns (uint256) {
        return _aaveToken.balanceOf(address(this));
    }

    function _payout(uint256 amount, address payee) internal override {
        require(this.isCapitalAvailable(amount), "Insufficient Funds");
        if (reservesBalance() < amount) {
            uint256 toBeRedeemed = amount;
            if (amount > investmentsBalance()) {
                toBeRedeemed = investmentsBalance();
            }
            _aaveToken.redeem(toBeRedeemed);
        }
        _dai.safeTransfer(payee, amount);
    }
}
