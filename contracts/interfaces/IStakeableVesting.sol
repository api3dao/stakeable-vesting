// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IStakeableVesting {
    function initialize(
        address _owner,
        address _beneficiary,
        uint32 startTimestamp,
        uint32 endTimestamp,
        uint192 amount
    ) external;

    function token() external returns (address);

    function beneficiary() external returns (address);

    function vesting()
        external
        returns (uint32 startTimestamp, uint32 endTimestamp, uint192 amount);
}
