// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IStakeableVestingFactory.sol";
import "./StakeableVesting.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract StakeableVestingFactory is IStakeableVestingFactory {
    address public immutable override stakeableVestingImplementation;

    constructor(address token) {
        StakeableVesting stakeableVesting = new StakeableVesting(token);
        stakeableVesting.initialize(0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF);
        stakeableVesting.renounceOwnership();
        stakeableVestingImplementation = address(stakeableVesting);
    }

    function deployStakeableVesting(
        address owner,
        address beneficiary
    ) external override returns (address stakeableVesting) {
        stakeableVesting = Clones.clone(stakeableVestingImplementation);
        IStakeableVesting(stakeableVesting).initialize(beneficiary);
        IStakeableVesting(stakeableVesting).transferOwnership(owner);
    }
}
