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

    function setBeneficiary(address _beneficiary) external onlyOwner {
        require(_beneficiary != address(0), "Beneficiary address zero");
        beneficiary = _beneficiary;
        emit SetBeneficiary(_beneficiary);
    }

    function withdrawFromVesting() external override {
        require(msg.sender == beneficiary, "Sender not beneficiary");
        uint256 balance = IERC20(api3Token).balanceOf(address(this));
        uint256 poolBalance = 0; // TODO: Consider both staked and unstaked tokens
        uint256 totalBalance = balance + poolBalance;
        uint256 unvestedAmountInTotalBalance = unvestedAmount();
        require(
            totalBalance > unvestedAmountInTotalBalance,
            "No vested tokens"
        );
        uint256 vestedAmountInTotalBalance = totalBalance -
            unvestedAmountInTotalBalance;
        uint256 withdrawalAmount = vestedAmountInTotalBalance > balance
            ? balance
            : vestedAmountInTotalBalance;
        require(withdrawalAmount != 0, "No balance to withdraw");
        IERC20(api3Token).transfer(msg.sender, withdrawalAmount);
        emit WithdrawnFromVesting(withdrawalAmount);
    }

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
            return (amount * passedTime) / totalTime;
        }
    }
}
