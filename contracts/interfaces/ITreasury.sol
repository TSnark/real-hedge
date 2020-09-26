// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;

interface ITreasury {
    function earmarkFunds(uint256 earmarkedFunds) external;

    function releaseFunds(uint256 releasedFunds) external;

    function totalBalance() external view returns (uint256);

    function isCapitalAvailable(uint256 amount) external view returns (bool);

    function payout(uint256 amount, address to) external;

    function payoutEarmarked(uint256 amount, address payee) external;

    function deposit(uint256 premium, address payee) external;

    function addTreasurer(address newTreasurer) external;

    function removeTreasurer(address treasurer) external;
}
