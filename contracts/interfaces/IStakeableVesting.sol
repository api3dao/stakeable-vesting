// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IStakeableVesting {
    function transferOwnership(address newOwner) external;

    function initialize(address _beneficiary) external;

    function token() external returns (address);

    function beneficiary() external returns (address);
}
