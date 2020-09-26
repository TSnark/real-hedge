// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

interface IPriceProducer {
    function requestPrice(string memory location) external returns (bytes32);
}
