# Stakeable vesting

We previously had two implementations to reward contributors with API3 tokens:

1. [TimelockManager](https://github.com/api3dao/api3-contracts/blob/master/packages/timelock-manager/contracts/TimelockManager.sol) grants a token allocation that is timelocked with linear release.
   These tokens can be transferred to the [API3 staking pool](https://github.com/api3dao/api3-dao/tree/main/packages/pool) and staked before being released by the timelock.
   The allocations made this way are not revocable.

2. [TimeLockManagerReversible](https://github.com/api3dao/api3-contracts/blob/master/packages/timelock-manager/contracts/TimeLockManagerReversible.sol) vests tokens linearly.
   This contract only allows vested tokens to be withdrawable, it implements no functionality to transfer tokens (vested or unvested) to the API3 staking pool.
   It allows the tokens that are not yet vested to be revoked.

This contract implements a mix of the two with the following properties:

- The tokens are vested linearly and the vested tokens can be withdrawn
- The tokens (vested or unvested) can be transferred to the staking pool and staked
- The tokens that are held by this contract or transferred to the staking pool are revocable

Vestings are granted through a factory contract that deploys a proxy contract per each vesting.
The proxy contract has a `beneficiary` that can stake the tokens (and receive rewards, use voting power), or withdraw them within the limits of the vesting schedule.
The proxy contract has an `owner` that can update `beneficiary` (which is to be used as the means of revocation), and withdraw all tokens (vested or not).
Here, `beneficiary` is the vesting recipient, and `owner` is the "hot wallet multisig" referred to in the [related proposal](https://forum.api3.org/t/primary-proposal-contributor-token-allocations/1755).

## Instructions

Install the dependencies and build

```sh
yarn
yarn build
```

Test the contracts and get test coverage

```sh
yarn test
# Outputs to `./coverage`
yarn test:coverage
```

See [the user guide](./user-guide.md) for instructions for `owner` and `beneficiary`
