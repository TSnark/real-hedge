// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IPolicy.sol";

contract Treasury is AccessControl, ITreasury {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    uint256 public totalEarmarkedFunds;
    IERC20 private _dai;

    constructor(IERC20 dai) public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _dai = dai;
    }

    receive() external payable {}

    function depositPremium(uint256 premium) external override {
        _dai.safeTransferFrom(msg.sender, address(this), premium);
    }

    function isCapitalAvailable(uint256 amount)
        external
        override
        view
        returns (bool)
    {
        return _dai.balanceOf(address(this)) >= totalEarmarkedFunds.add(amount);
    }

    function totalBalance() public override view returns (uint256) {
        return _dai.balanceOf(address(this));
    }

    function earmarkFunds(uint256 earmarkedFunds) external override {
        require(hasRole(TREASURER_ROLE, _msgSender()), "Access Denied");
        require(this.isCapitalAvailable(earmarkedFunds), "Insufficient Funds");
        totalEarmarkedFunds = totalEarmarkedFunds.add(earmarkedFunds);
    }

    function payout(uint256 amount, address payee) public override {
        require(hasRole(TREASURER_ROLE, _msgSender()), "Access Denied");
        _payout(amount, payee);
    }

    function payoutEarmarked(uint256 amount, address payee) external override {
        require(hasRole(TREASURER_ROLE, _msgSender()), "Access Denied");
        _releaseFunds(amount);
        _payout(amount, payee);
    }

    function _payout(uint256 amount, address payee) private {
        require(this.isCapitalAvailable(amount), "Insufficient Funds");
        _dai.safeTransfer(payee, amount);
    }

    function releaseFunds(uint256 releasedFunds) external override {
        require(hasRole(TREASURER_ROLE, _msgSender()), "Access Denied");
        _releaseFunds(releasedFunds);
    }

    function _releaseFunds(uint256 releasedFunds) private {
        require(
            totalEarmarkedFunds >= releasedFunds,
            "Cannot release more than earmarked"
        );
        totalEarmarkedFunds = totalEarmarkedFunds.sub(releasedFunds);
    }

    function addTreasurer(address newTreasurer) external override {
        grantRole(TREASURER_ROLE, newTreasurer);
    }

    function removeTreasurer(address treasurer) external override {
        revokeRole(TREASURER_ROLE, treasurer);
    }
}
