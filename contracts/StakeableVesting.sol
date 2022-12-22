// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IStakeableVesting.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakeableVesting is Ownable, IStakeableVesting {
    address public immutable override token;
    address public override beneficiary;

    constructor(address _token) {
        require(_token != address(0), "Token address zero");
        token = _token;
        beneficiary = 0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF;
        renounceOwnership();
    }

    function initialize(
        address _owner,
        address _beneficiary
    ) external override {
        require(beneficiary == address(0), "Already initialized");
        require(_owner != address(0), "Owner address zero");
        require(_beneficiary != address(0), "Beneficiary address zero");
        _transferOwnership(_owner);
        beneficiary = _beneficiary;
    }
}
