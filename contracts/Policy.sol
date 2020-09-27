// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IPriceConsumer.sol";
import "./interfaces/IPriceProducer.sol";
import "./interfaces/ITreasury.sol";
import "./interfaces/IPolicy.sol";

contract Policy is Ownable, ERC721, IPriceConsumer, IPolicy {
    using Counters for Counters.Counter;

    event PolicyClaimed(address indexed holder, uint256 policyId, bool succees);

    Counters.Counter private _tokenIdTracker;

    ITreasury private _treasury;
    IPriceProducer private _priceFetcher;

    mapping(uint256 => PolicyData) public policies;
    mapping(bytes32 => uint256) private _pendingRequests;

    constructor(ITreasury treasury, IPriceProducer priceFetcher)
        public
        ERC721("Policy", "REPLC")
    {
        _treasury = treasury;
        _priceFetcher = priceFetcher;
    }

    function mintPolicy(address to, PolicyData memory data)
        public
        override
        onlyOwner
        returns (uint256 tokenId)
    {
        // We can just use balanceOf to create the new tokenId because tokens
        // can be burned (destroyed), so we need a separate counter.
        tokenId = _tokenIdTracker.current();
        _mint(to, tokenId);
        _tokenIdTracker.increment();
        data.policyId = tokenId;
        policies[tokenId] = data;
        return tokenId;
    }

    function claim(uint256 policyId) public {
        PolicyData storage policy = policies[policyId];
        require(policy.active, "The policy must be active");
        if (policy.end < block.timestamp) {
            _burnPolicy(policyId);
        } else {
            bytes32 requestId = _priceFetcher.requestPrice(policy.externalCode);
            _pendingRequests[requestId] = policyId;
        }
    }

    function onPriceResponse(bytes32 requestId, uint256 currentPrice)
        public
        override
    {
        require(msg.sender == address(_priceFetcher), "Access denied");
        uint256 policyId = _pendingRequests[requestId];
        PolicyData storage policy = policies[policyId];
        address holder = ownerOf(policyId);
        if (policy.active && currentPrice < policy.strikePrice) {
            _treasury.payoutEarmarked(policy.coverAmount, holder);
            _burnPolicy(policyId);
            emit PolicyClaimed(holder, policyId, true);
        } else {
            emit PolicyClaimed(holder, policyId, false);
        }
    }

    function burnExpiredPolicy(uint256 policyId) external {
        PolicyData storage policy = policies[policyId];
        _treasury.releaseFunds(policy.coverAmount);
        _burnPolicy(policyId);
    }

    function _burnPolicy(uint256 policyId) private {
        _burn(policyId);
        delete policies[policyId];
    }
}
