// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "./interfaces/ITreasury.sol";
import "./interfaces/IPolicy.sol";
import "./interfaces/IPriceConsumer.sol";
import "./interfaces/IPriceProducer.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract Underwriter is Ownable, IPriceConsumer {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    struct PolicyRequest {
        uint256 durationInS;
        string externalCode;
        uint256 coverAmount;
        uint256 minLossInBps;
    }

    struct PendingPolicy {
        address holder;
        uint256 premium;
        uint256 durationInS;
        string externalCode;
        uint256 coverAmount;
        uint256 minLossInBps;
    }

    event PolicyUnderwritten(
        address indexed holder,
        uint256 policyId,
        uint256 end
    );

    event PremiumRefunded(address indexed holder, uint256 premium);

    ITreasury private _treasury;
    IPolicy private _policy;
    IPriceProducer private _priceFetcher;
    IERC20 private _dai;

    uint256 public maxCoverAmount;
    uint256 public minLossProtectionInBps;
    uint256 public maxPolicyDurationInS;
    uint256 public minimumPrice;

    mapping(bytes32 => PendingPolicy) private _pendingPolicies;

    constructor(
        ITreasury treasury,
        IPriceProducer priceFetcher,
        IPolicy policy,
        IERC20 dai
    ) public {
        _treasury = treasury;
        _priceFetcher = priceFetcher;
        _policy = policy;
        _dai = dai;
        minimumPrice = 100000;
        maxCoverAmount = 50000 * 1e18;
        maxPolicyDurationInS = 52 * 5 weeks; //~5 Years
        minLossProtectionInBps = 10 * 100; //Minimum loss protection is 10%
    }

    function buyPolicy(PolicyRequest memory request) public payable {
        require(
            request.coverAmount <= maxCoverAmount,
            "Amount exceeds maximum"
        );
        require(request.coverAmount > 0, "Amount must be positive");
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
        uint256 premium = calculatePremium(request);
        _dai.safeTransferFrom(msg.sender, address(_treasury), premium);
        _treasury.earmarkFunds(premium);
        bytes32 requestId = _priceFetcher.requestPrice(request.externalCode);
        _pendingPolicies[requestId] = PendingPolicy(
            msg.sender,
            premium,
            request.durationInS,
            request.externalCode,
            request.coverAmount,
            request.minLossInBps
        );
    }

    function calculatePremium(PolicyRequest memory request)
        public
        pure
        returns (uint256)
    {
        return
            request
                .durationInS
                .div(30 days)
                .mul(request.coverAmount)
                .div(4000000)
                .mul(11000 - request.minLossInBps);
    }

    function onPriceResponse(bytes32 requestId, uint256 currentPrice)
        public
        override
    {
        require(
            msg.sender == address(_priceFetcher),
            "Only price fetcher can call this method"
        );

        PendingPolicy storage pendingPolicy = _pendingPolicies[requestId];

        try _treasury.earmarkFunds(pendingPolicy.coverAmount)  {
            if (currentPrice > minimumPrice) {
                //This would not overflow even with average prices in the billions
                uint256 strikePrice = (10000 - pendingPolicy.minLossInBps)
                    .mul(currentPrice)
                    .div(10000);

                IPolicy.PolicyData memory policyData = IPolicy.PolicyData({
                    coverAmount: pendingPolicy.coverAmount,
                    end: block.timestamp + pendingPolicy.durationInS,
                    externalCode: pendingPolicy.externalCode,
                    strikePrice: strikePrice,
                    active: true
                });

                uint256 policyId = _policy.mintPolicy(
                    pendingPolicy.holder,
                    policyData
                );
                emit PolicyUnderwritten(
                    pendingPolicy.holder,
                    policyId,
                    policyData.end
                );
            } else {
                _refund(pendingPolicy.holder, pendingPolicy.premium);
            }
        } catch {
            _refund(pendingPolicy.holder, pendingPolicy.premium);
        }

        delete _pendingPolicies[requestId];
    }

    function _refund(address holder, uint256 premium) private {
        _treasury.payoutEarmarked(premium, holder);
        emit PremiumRefunded(holder, premium);
    }
}
