// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../interfaces/IApi3Pool.sol";

contract MockApi3Pool is IApi3Pool {
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
