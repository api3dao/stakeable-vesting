// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./interfaces/IStakeableVestingFactory.sol";
import "./StakeableVesting.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakeableVestingFactory is IStakeableVestingFactory {
    address public immutable override api3Token;

    address public immutable override stakeableVestingImplementation;

    constructor(address _api3Token, address _api3Pool) {
        require(_api3Token != address(0), "Api3Token address zero");
        api3Token = _api3Token;
        stakeableVestingImplementation = address(
            new StakeableVesting(_api3Token, _api3Pool)
        );
    }

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
                    amount
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
