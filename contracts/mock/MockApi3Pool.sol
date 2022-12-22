// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/IApi3Pool.sol";

contract MockApi3Pool is IApi3Pool {
    function depositRegular(uint256 amount) external override {}

    function withdrawRegular(uint256 amount) external override {}

    function withdrawPrecalculated(uint256 amount) external override {}

    function stake(uint256 amount) external override {}

    function scheduleUnstake(uint256 amount) external override {}

    function unstake() external override {}

    function delegateVotingPower(address delegate) external override {}

    function undelegateVotingPower() external {}

    function userStake(
        address userAddress
    ) external view override returns (uint256) {}

    function getUser(
        address userAddress
    )
        external
        view
        override
        returns (
            uint256 unstaked,
            uint256 vesting,
            uint256 unstakeShares,
            uint256 unstakeAmount,
            uint256 unstakeScheduledFor,
            uint256 lastDelegationUpdateTimestamp,
            uint256 lastProposalTimestamp
        )
    {}
}
