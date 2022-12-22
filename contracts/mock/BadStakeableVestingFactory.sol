// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "../StakeableVesting.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BadStakeableVestingFactory {
    address public immutable api3Token;

    address public immutable stakeableVestingImplementation;

    constructor(address _api3Token) {
        api3Token = _api3Token;
        stakeableVestingImplementation = address(
            new StakeableVesting(_api3Token)
        );
    }

    function deployStakeableVestingWithZeroOwner(
        address beneficiary,
        uint32 startTimestamp,
        uint32 endTimestamp,
        uint192 amount
    ) external returns (address stakeableVesting) {
        stakeableVesting = Clones.clone(stakeableVestingImplementation);
        IERC20(api3Token).transferFrom(msg.sender, stakeableVesting, amount);
        IStakeableVesting(stakeableVesting).initialize(
            address(0),
            beneficiary,
            startTimestamp,
            endTimestamp,
            amount
        );
    }

    function deployStakeableVestingWithoutTransferringTokens(
        address beneficiary,
        uint32 startTimestamp,
        uint32 endTimestamp,
        uint192 amount
    ) external returns (address stakeableVesting) {
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
