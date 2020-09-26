// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "./interfaces/IDateHelper.sol";
import "./interfaces/IPriceConsumer.sol";
import "./interfaces/IPriceProducer.sol";

contract PriceFetcher is AccessControl, ChainlinkClient, IPriceProducer {
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    address private _oracle;
    bytes32 private _jobId;
    uint256 private _fee;
    uint256 private constant _PRICES_TIME_OFFSET = 90 days;

    mapping(bytes32 => IPriceConsumer) private _pendingRequestConsumers;

    IDateHelper private _dateHelper;

    constructor(
        address link,
        address oracle,
        bytes32 jobId,
        uint256 fee,
        IDateHelper dateHelper
    ) public {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        if (link == address(0)) {
            setPublicChainlinkToken();
        } else {
            setChainlinkToken(link);
        }

        _oracle = oracle;
        _jobId = jobId;
        _dateHelper = dateHelper;
        _fee = fee;
    }

    function requestPrice(string memory location)
        public
        override
        returns (bytes32)
    {
        require(hasRole(USER_ROLE, _msgSender()), "Access Denied");

        Chainlink.Request memory request = buildChainlinkRequest(
            _jobId,
            address(this),
            this.onPriceResponse.selector
        );
        string memory yearMonth = _dateHelper.isoYearMonth(
            block.timestamp - _PRICES_TIME_OFFSET
        );
        request.add(
            "get",
            "https://landregistry.data.gov.uk/data/ukhpi/region"
        );
        request.add(
            "extPath",
            string(abi.encodePacked(location, "/month/", yearMonth, ".json"))
        );

        request.add("path", "result.primaryTopic.averagePrice");

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

    function addUser(address newUser) external {
        grantRole(USER_ROLE, newUser);
    }

    function removeUser(address user) external {
        revokeRole(USER_ROLE, user);
    }
}
