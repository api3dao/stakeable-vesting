// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IStakeableVestingFactory {
    function deployStakeableVesting(
        address beneficiary
    ) external returns (address stakeableVesting);

    function stakeableVestingImplementation() external returns (address);
}
