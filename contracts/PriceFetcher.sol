// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IPriceConsumer.sol";
import "./interfaces/IPriceProducer.sol";

contract PriceFetcher is ChainlinkClient, IPriceProducer {
    address private _oracle;
    bytes32 private _jobId;
    uint256 private _fee;

    mapping(bytes32 => IPriceConsumer) private _pendingRequestConsumers;

    /**
     * Network: Kovan
     * Oracle: Chainlink - 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e
     * Job ID: Chainlink - 29fa9aa13bf1468788b7cc4a500a45b8
     * Fee: 0.1 LINK
     */
    constructor() public {
        // setPublicChainlinkToken();
        // _oracle = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e;
        // _jobId = "29fa9aa13bf1468788b7cc4a500a45b8";
        // _fee = 0.1 * 10**18; // 0.1 LINK
    }

    function requestPrice(string memory _code)
        public
        override
        returns (bytes32)
    {
        Chainlink.Request memory request = buildChainlinkRequest(
            _jobId,
            address(this),
            this.onPriceResponse.selector
        );

        // Set the URL to perform the GET request on
        request.add(
            "get",
            "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD"
        );

        // Set the path to find the desired data in the API response, where the response format is:
        // {"USD":243.33}
        request.add("path", _code);

        // Multiply the result by 100 to remove decimals
        request.addInt("times", 100);

        // Sends the request
        bytes32 requestId = sendChainlinkRequestTo(_oracle, request, _fee);
        _pendingRequestConsumers[requestId] = IPriceConsumer(msg.sender);
        return requestId;
    }

    function onPriceResponse(bytes32 requestId, uint256 currentPrice)
        public
        recordChainlinkFulfillment(requestId)
    {
        _pendingRequestConsumers[requestId].onPriceResponse(
            requestId,
            currentPrice
        );
        delete _pendingRequestConsumers[requestId];
    }
}
