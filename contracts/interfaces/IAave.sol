// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.7.0;

interface IAave {
    function deposit(
        address _reserve,
        uint256 _amount,
        uint16 _referralCode
    ) external;
}
