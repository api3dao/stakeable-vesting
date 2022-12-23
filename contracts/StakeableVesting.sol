// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStakeableVesting.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "api3-dao/packages/pool/contracts/interfaces/v0.8/IApi3Pool.sol";

// Implements the Api3Pool interface explicitly instead of acting as a general
// call forwarder that is only restricted in interacting with Api3Token. This
// is because the user is expected to interact with the contract through
// generic ABI-generated UI such as Etherscan and Safe.
contract StakeableVesting is Ownable, IStakeableVesting {
    struct Vesting {
        uint32 startTimestamp;
        uint32 endTimestamp;
        uint192 amount;
    }

    address public immutable override api3Token;

    address public immutable api3Pool;

    address public override beneficiary;

    Vesting public override vesting;

    modifier onlyBeneficiary() {
        require(msg.sender == beneficiary, "Sender not beneficiary");
        _;
    }

    constructor(address _api3Token, address _api3Pool) {
        require(_api3Token != address(0), "Api3Token address zero");
        api3Token = _api3Token;
        require(_api3Pool != address(0), "Api3Pool address zero");
        api3Pool = _api3Pool;
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
        require(
            IERC20(api3Token).balanceOf(address(this)) == _amount,
            "Balance is not vesting amount"
        );
        _transferOwnership(_owner);
        beneficiary = _beneficiary;
        vesting = Vesting({
            startTimestamp: _startTimestamp,
            endTimestamp: _endTimestamp,
            amount: _amount
        });
    }

    function setBeneficiary(address _beneficiary) external override onlyOwner {
        require(_beneficiary != address(0), "Beneficiary address zero");
        beneficiary = _beneficiary;
        emit SetBeneficiary(_beneficiary);
    }

    function withdrawAsOwner() external override onlyOwner {
        uint256 withdrawalAmount = IERC20(api3Token).balanceOf(address(this));
        require(withdrawalAmount != 0, "No balance to withdraw");
        IERC20(api3Token).transfer(msg.sender, withdrawalAmount);
        emit WithdrawnAsOwner(withdrawalAmount);
    }

    function withdrawAsBeneficiary() external override onlyBeneficiary {
        uint256 balance = IERC20(api3Token).balanceOf(address(this));
        require(balance != 0, "Balance zero");
        uint256 totalBalance = balance + poolBalance();
        uint256 unvestedAmountInTotalBalance = unvestedAmount();
        require(
            totalBalance > unvestedAmountInTotalBalance,
            "Tokens in balance not vested yet"
        );
        uint256 vestedAmountInTotalBalance = totalBalance -
            unvestedAmountInTotalBalance;
        uint256 withdrawalAmount = vestedAmountInTotalBalance > balance
            ? balance
            : vestedAmountInTotalBalance;
        IERC20(api3Token).transfer(msg.sender, withdrawalAmount);
        emit WithdrawnAsBeneficiary(withdrawalAmount);
    }

    function depositAtPool(uint256 amount) external override onlyBeneficiary {
        IERC20(api3Token).approve(api3Pool, amount);
        IApi3Pool(api3Pool).depositRegular(amount);
    }

    function withdrawAtPool(uint256 amount) external override onlyBeneficiary {
        IApi3Pool(api3Pool).withdrawRegular(amount);
    }

    // `precalculateUserLocked()` at Api3Pool can be called by anyone with the
    // respective user address
    function withdrawPrecalculatedAtPool(
        uint256 amount
    ) external override onlyBeneficiary {
        IApi3Pool(api3Pool).withdrawPrecalculated(amount);
    }

    function stakeAtPool(uint256 amount) external override onlyBeneficiary {
        IApi3Pool(api3Pool).stake(amount);
    }

    function scheduleUnstakeAtPool(
        uint256 amount
    ) external override onlyBeneficiary {
        IApi3Pool(api3Pool).scheduleUnstake(amount);
    }

    function unstakeAtPool() external override onlyBeneficiary {
        IApi3Pool(api3Pool).unstake(address(this));
    }

    function delegateAtPool(
        address delegate
    ) external override onlyBeneficiary {
        IApi3Pool(api3Pool).delegateVotingPower(delegate);
    }

    function undelegateAtPool() external override onlyBeneficiary {
        IApi3Pool(api3Pool).undelegateVotingPower();
    }

    // Ignores timelocks implemented at Api3Pool, though these will still limit
    // the beneficiary while calling `withdrawAtPool()`
    function unvestedAmount() public view override returns (uint256) {
        (uint32 startTimestamp, uint32 endTimestamp, uint192 amount) = (
            vesting.startTimestamp,
            vesting.endTimestamp,
            vesting.amount
        );
        if (block.timestamp <= startTimestamp) {
            return amount;
        } else if (block.timestamp >= endTimestamp) {
            return 0;
        } else {
            uint256 passedTime = block.timestamp - startTimestamp;
            uint256 totalTime = endTimestamp - startTimestamp;
            return amount - (amount * passedTime) / totalTime;
        }
    }

    function poolBalance() private view returns (uint256) {
        uint256 staked = IApi3Pool(api3Pool).userStake(address(this));
        (uint256 unstaked, , uint256 unstaking, , , , ) = IApi3Pool(api3Pool)
            .getUser(address(this));
        return staked + unstaked + unstaking;
    }
}
