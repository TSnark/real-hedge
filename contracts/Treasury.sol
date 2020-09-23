// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IPolicy.sol";

contract Treasury is AccessControl, ITreasury {
    using SafeMath for uint256;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");
    mapping(address => uint256) private _balances;

    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    receive() external payable {}

    function depositPremium() external override payable {}

    function isCapitalAvailable(uint256 amount)
        external
        override
        view
        returns (bool)
    {
        return true; //TODO proper implementation
    }

    function addTreasurer(address newTreasurer) external override {
        grantRole(TREASURER_ROLE, newTreasurer);
    }

    function removeTreasurer(address treasurer) external override {
        revokeRole(TREASURER_ROLE, treasurer);
    }

    function payout(uint256 amount, address payee) external override {
        require(
            hasRole(TREASURER_ROLE, _msgSender()),
            "Treasury: must have treasury role to payout"
        );
        _balances[payee] = _balances[payee].add(amount);
    }

    function withdraw(address payable payee) external override {
        require(_balances[payee] > 0);
        uint256 amount = _balances[payee];
        _balances[payee] = 0;
        payee.transfer(amount);
    }
}
