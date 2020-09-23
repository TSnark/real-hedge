// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "../interfaces/IPriceConsumer.sol";
import "../interfaces/IPriceProducer.sol";

contract ControllablePriceFetcher is IPriceProducer {
    uint256 public counter;
    mapping(bytes32 => IPriceConsumer) private _pendingRequestConsumers;

    constructor() public {}

    function requestPrice(string memory _code)
        public
        override
        returns (bytes32)
    {
        bytes32 requestId = bytes32(++counter);
        _pendingRequestConsumers[requestId] = IPriceConsumer(msg.sender);
        return requestId;
    }

    function onPriceResponse(bytes32 requestId, uint256 currentPrice) public {
        _pendingRequestConsumers[requestId].onPriceResponse(
            requestId,
            currentPrice
        );
        delete _pendingRequestConsumers[requestId];
    }
}
