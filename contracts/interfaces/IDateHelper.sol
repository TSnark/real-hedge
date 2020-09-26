// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;

interface IDateHelper {
    function isoYearMonth(uint256 timestamp)
        external
        view
        returns (string memory);
}
