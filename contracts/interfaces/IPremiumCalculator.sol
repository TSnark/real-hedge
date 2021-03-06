// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

interface IPremiumCalculator {
    function calculatePremium(string memory _code) external returns (bytes32);
}
