// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IStakeableVestingFactory {
    event DeployedStakeableVesting(
        address indexed deployer,
        address indexed beneficiary,
        uint32 startTimestamp,
        uint32 endTimestamp,
        uint192 amount
    );

    function deployStakeableVesting(
        address beneficiary,
        uint32 startTimestamp,
        uint32 endTimestamp,
        uint192 amount
    ) external returns (address stakeableVesting);

    function api3Token() external returns (address);

    function stakeableVestingImplementation() external returns (address);
}
