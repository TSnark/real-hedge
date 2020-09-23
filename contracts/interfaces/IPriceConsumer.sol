// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

interface IPriceConsumer {
    function onPriceResponse(bytes32 requestId, uint256 currentPrice) external;
}
