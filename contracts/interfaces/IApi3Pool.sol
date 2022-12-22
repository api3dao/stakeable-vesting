// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IApi3Pool {
    function depositRegular(uint256 amount) external;

    function withdrawRegular(uint256 amount) external;

    function withdrawPrecalculated(uint256 amount) external;

    function stake(uint256 amount) external;

    function scheduleUnstake(uint256 amount) external;

    function unstake() external;

    function delegateVotingPower(address delegate) external;

    function undelegateVotingPower() external;

    function userStake(address userAddress) external view returns (uint256);

    function getUser(
        address userAddress
    )
        external
        view
        returns (
            uint256 unstaked,
            uint256 vesting,
            uint256 unstakeShares,
            uint256 unstakeAmount,
            uint256 unstakeScheduledFor,
            uint256 lastDelegationUpdateTimestamp,
            uint256 lastProposalTimestamp
        );
}
