// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IApi3Pool {
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
