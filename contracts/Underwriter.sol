// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/ITreasury.sol";
import "./interfaces/IPolicy.sol";
import "./interfaces/IPriceConsumer.sol";
import "./interfaces/IPriceProducer.sol";
// import "./interfaces/IPremiumCalculator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract Underwriter is Ownable, IPriceConsumer {
    using SafeMath for uint256;

    enum Status {Pending, Active}

    struct QuoteRequest {
        uint256 durationInS;
        string externalCode;
        uint256 coverAmountInWei;
        uint256 minLossInBps;
    }

    struct Quote {
        uint256 premium;
        uint256 validUntil;
        uint256 strikePrice;
        QuoteRequest request;
        address requester;
        Status status;
    }

    event QuoteCreated(
        address indexed requester,
        bytes32 requestId,
        uint256 premium,
        uint256 validUntil
    );

    event PolicyUnderwritten(
        address indexed holder,
        bytes32 requestId,
        uint256 policyId,
        IPolicy.PolicyData policy
    );

    ITreasury private _treasury;
    IPolicy private _policy;
    IPriceProducer private _priceFetcher;
    // IPremiumCalculator private _premiumCalculator;

    uint256 public maxCoverAmountInWei;
    uint256 public maxQuoteValidityInS;
    uint256 public minLossProtectionInBps;
    uint256 public maxPolicyDurationInS;

    mapping(bytes32 => Quote) private _quotes;
    mapping(address => bytes32[]) private _quotesIdByUser; //TODO populate

    constructor(
        ITreasury treasury,
        IPriceProducer priceFetcher,
        IPolicy policy // IPremiumCalculator premiumCalculator
    ) public {
        _treasury = treasury;
        _priceFetcher = priceFetcher;
        _policy = policy;
        maxCoverAmountInWei = 10 ether;
        maxQuoteValidityInS = 1 hours;
        maxPolicyDurationInS = 52 * 5 weeks; //~5 Years
        minLossProtectionInBps = 10 * 100; //Minimum loss protection is 10%
        // _premiumCalculator = premiumCalculator;
    }

    function createQuote(QuoteRequest memory request) public {
        require(
            request.coverAmountInWei < maxCoverAmountInWei,
            "Amount exceeds maximum"
        );
        require(request.coverAmountInWei > 0, "Amount must be positive");
        require(request.durationInS > 0, "Duration must be positive");
        require(
            request.durationInS < maxPolicyDurationInS,
            "Duration exceeds maximum"
        );
        require(
            request.minLossInBps > minLossProtectionInBps,
            "Protection lower than minimum"
        );
        require(
            request.minLossInBps <= 100 * 100, //100%
            "Protection greater than 100%"
        );

        bytes32 requestId = _priceFetcher.requestPrice(request.externalCode);
        _quotes[requestId] = Quote(
            0,
            block.timestamp + maxQuoteValidityInS,
            0,
            request,
            msg.sender,
            Status.Pending
        );
    }

    function onPriceResponse(bytes32 requestId, uint256 currentPrice)
        public
        override
    {
        require(
            msg.sender == address(_priceFetcher),
            "Only price fetcher can call this method"
        );
        Quote storage quote = _quotes[requestId];

        //This would not overflow even with average prices in the billions
        uint256 strikePrice = (10000 - quote.request.minLossInBps)
            .mul(currentPrice)
            .div(10000);

        uint256 premium = 1;
        quote.premium = premium;
        quote.strikePrice = strikePrice;
        quote.status = Status.Active;
        emit QuoteCreated(
            quote.requester,
            requestId,
            quote.premium,
            quote.validUntil
        );
    }

    function underwritePolicy(bytes32 quoteId) public payable {
        Quote storage quote = _quotes[quoteId];
        require(
            _treasury.isCapitalAvailable(quote.request.coverAmountInWei),
            "Insufficient funds"
        );
        require(msg.value >= quote.premium, "Premium not fully paid");
        require(msg.sender == quote.requester, "Only requester can buy policy");
        require(block.timestamp <= quote.validUntil, "Quote has elapsed");
        IPolicy.PolicyData memory policyData = IPolicy.PolicyData({
            coverAmountInWei: quote.request.coverAmountInWei,
            end: block.timestamp + quote.request.durationInS,
            externalCode: quote.request.externalCode,
            strikePrice: quote.strikePrice,
            active: true
        });
        uint256 policyId = _policy.mintPolicy(msg.sender, policyData);
        _treasury.depositPremium{value: address(this).balance};
        emit PolicyUnderwritten(msg.sender, quoteId, policyId, policyData);
        delete _quotes[quoteId];
    }
}
