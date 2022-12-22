// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStakeableVesting.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakeableVesting is Ownable, IStakeableVesting {
    struct Vesting {
        uint32 startTimestamp;
        uint32 endTimestamp;
        uint192 amount;
    }

    address public immutable override api3Token;

    address public override beneficiary;

    Vesting public override vesting;

    constructor(address _api3Token) {
        require(_api3Token != address(0), "Api3Token address zero");
        api3Token = _api3Token;
        beneficiary = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;
        renounceOwnership();
    }

    function initialize(
        address _owner,
        address _beneficiary,
        uint32 _startTimestamp,
        uint32 _endTimestamp,
        uint192 _amount
    ) external override {
        require(beneficiary == address(0), "Already initialized");
        require(_owner != address(0), "Owner address zero");
        require(_beneficiary != address(0), "Beneficiary address zero");
        require(_startTimestamp != 0, "Start timestamp zero");
        require(_endTimestamp > _startTimestamp, "End not later than start");
        require(_amount != 0, "Amount zero");
        _transferOwnership(_owner);
        beneficiary = _beneficiary;
        vesting = Vesting({
            startTimestamp: _startTimestamp,
            endTimestamp: _endTimestamp,
            amount: _amount
        });
    }
}
