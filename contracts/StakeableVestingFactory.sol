// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IStakeableVestingFactory.sol";
import "./StakeableVesting.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakeableVestingFactory is IStakeableVestingFactory {
    address public immutable override token;

    address public immutable override stakeableVestingImplementation;

    constructor(address _token) {
        require(_token != address(0), "Token address zero");
        token = _token;
        stakeableVestingImplementation = address(new StakeableVesting(_token));
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
        emit DeployedStakeableVesting(
            msg.sender,
            beneficiary,
            startTimestamp,
            endTimestamp,
            amount
        );
    }
}
