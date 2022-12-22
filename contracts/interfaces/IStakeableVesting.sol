// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IStakeableVesting {
    event SetBeneficiary(address beneficiary);

    event WithdrawnFromVesting(uint256 amount);

    function initialize(
        address _owner,
        address _beneficiary,
        uint32 startTimestamp,
        uint32 endTimestamp,
        uint192 amount
    ) external;

    function withdrawFromVesting() external;

    function unvestedAmount() external view returns (uint256);

    function api3Token() external returns (address);

    function beneficiary() external returns (address);

    function vesting()
        external
        returns (uint32 startTimestamp, uint32 endTimestamp, uint192 amount);
}
