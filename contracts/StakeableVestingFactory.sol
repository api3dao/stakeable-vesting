// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IStakeableVestingFactory.sol";
import "./StakeableVesting.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title Contract that deploys a StakeableVesting implementation and allows
/// it to be cloned to create vestings
contract StakeableVestingFactory is IStakeableVestingFactory {
    /// @notice Api3Token address
    address public immutable override api3Token;

    /// @notice StakeableVesting implementation address
    address public immutable override stakeableVestingImplementation;

    /// @param _api3Token Api3Token address
    /// @param _api3Pool Api3Pool address
    constructor(address _api3Token, address _api3Pool) {
        require(_api3Token != address(0), "Api3Token address zero");
        api3Token = _api3Token;
        stakeableVestingImplementation = address(
            new StakeableVesting(_api3Token, _api3Pool)
        );
    }

    /// @notice Deploys a StakeableVesting clone and transfers the vesting
    /// amount to it from the sender
    /// @dev The sender needs to approve `amount` API3 tokens to this contract
    /// before calling this.
    /// The sender will be the owner of the StakeableVesting clone, allowing it
    /// to revoke the vesting.
    /// @param beneficiary Beneficiary of the vesting
    /// @param startTimestamp Starting timestamp of the vesting
    /// @param endTimestamp Ending timestamp of the vesting
    /// @param amount Amount of tokens to be vested over the period
    /// @return stakeableVesting StakeableVesting clone address
    function deployStakeableVesting(
        address beneficiary,
        uint32 startTimestamp,
        uint32 endTimestamp,
        uint192 amount
    ) external override returns (address stakeableVesting) {
        stakeableVesting = Clones.cloneDeterministic(
            stakeableVestingImplementation,
            keccak256(
                abi.encodePacked(
                    beneficiary,
                    startTimestamp,
                    endTimestamp,
                    amount,
                    msg.sender
                )
            )
        );
        IERC20(api3Token).transferFrom(msg.sender, stakeableVesting, amount);
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
