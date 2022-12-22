// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IStakeableVestingFactory.sol";
import "./StakeableVesting.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

contract StakeableVestingFactory is IStakeableVestingFactory {
    address public immutable override stakeableVestingImplementation;

    constructor(address token) {
        stakeableVestingImplementation = address(new StakeableVesting(token));
    }

    function deployStakeableVesting(
        address beneficiary,
        uint32 startTimestamp,
        uint32 endTimestamp,
        uint192 amount
    ) external override returns (address stakeableVesting) {
        stakeableVesting = Clones.clone(stakeableVestingImplementation);
        IStakeableVesting(stakeableVesting).initialize(
            msg.sender,
            beneficiary,
            startTimestamp,
            endTimestamp,
            amount
        );
    }
}
