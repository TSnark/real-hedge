# Real Hedge Protocol

[Live test version](https://tsnark.github.io/real-hedge/).

## The Protocol

This project was built for the [Chain Link Hackathon 2020](https://hack.chain.link/)

Real Hedge is an new de-fi protocol aiming to provide hedging facilities to real estate property owners. The protocol is comprised of multiple parts:

- Chainlink integration
- Aave integration
- rDAI an ERC20 token for liquidity providers
- REPLC an ERC721 token for representing individual policies
- On chain underwriting
- On chain claims handling

## Overview

The protocol allows anyone to hedge real estate pricing risks in a fully decentralised fashion. A user can submit a request to purchase a policy to the onchain [underwriter](contracts/Underwriter.sol), specifying duration, cover amount and location.
The underwriter, using the chainlink oracle and the data sources, creates a policy with a set strike price. Whenever the price goes below the strike price the policy holder can claim the cover amount on his [policy](contracts/Policy.sol).
The claiming process also relies on the chainlink network to assess the current property price, if the strike price is met the cover is tranferred to the policy holder.
The liquidity for paying claims is provided by LPs. LPs earn returns on their investments in two ways, premiums and interests collected on Aave money market.

## rDAI Token

When an LP deposits DAIs into the protocol, new rDAI are minted for the LP. rDAIs are redeemable for a pro-rata amount of DAI held in [treasury](contracts/AaveTreasury.sol). Tokens can be redeemed only if enough liquidity is available for policies claims.

### Aave investing

Since policies can potentially have long durations, 90% of the capital stored in treasury is invested in Aave and redeemed as necessary for operational needs.

## REPLC Token

Each policy is represented by a NFT that can be traded on secondary markets. REPLC tokens are burned on expiry or after a successful claim.

## Data sources

At the moment the protocol covers only the U.K. and it uses primary data from the British government (https://landregistry.data.gov.uk/). The highest price resolution is the local authority area (i.e. Enfield). This helps in preventing possible price manipulations that can happen when tracking prices movements in smaller areas.

## Future developments

- [ ] Auto-complete for the location field
- [ ] Better notifications handling
- [ ] Realistic pricing model
- [ ] Use of current price in pricing
- [ ] Audits
- [ ] More geographies

#### Credits

[Chainlink](https://chain.link) - This protocol is possible thanks to the decentralized oracle network

[Aave](https://aave.com) - For providing money market capabilities

[Yam](https://yam.finance) - For heavily inspiring our frontend

[yEarn](https://yearn.finance/ - For inspiring the rDAI token
