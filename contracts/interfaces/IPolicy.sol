// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;
pragma experimental ABIEncoderV2;

interface IPolicy {
    struct PolicyData {
        uint256 coverAmount;
        uint256 end;
        string externalCode;
        uint256 strikePrice;
        bool active;
    }

    function mintPolicy(address to, PolicyData calldata data)
        external
        returns (uint256);
}
