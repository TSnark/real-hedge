// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;

interface ITreasury {
    function isCapitalAvailable(uint256 amount) external view returns (bool);

    function payout(uint256 amount, address to) external;

    function depositPremium() external payable;

    function withdraw(address payable payee) external;

    function addTreasurer(address newTreasurer) external;

    function removeTreasurer(address treasurer) external;
}
