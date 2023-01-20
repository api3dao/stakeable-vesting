# StakeableVesting owner guide

## How to create a new vesting?

- Determine the vesting parameters

  - `beneficiary` is the address of the recipient
  - `startTimestamp` is the time the vesting will start in Unix time.
    You can use an online tool (such as https://www.unixtimestamp.com/) to do the conversion.
    Make sure to provide the date you intended to use for the other multisig signers to be able to confirm.
    `startTimestamp` can be in the past
  - `endTimestamp` is the time the vesting will end in Unix time
  - `amount` is the total amount of API3 tokens to be vested in Wei

- Confirm that the multisig has at least `amount` API3 tokens

- Create a new transaction that calls the API3 token contract's (`0x0b38210ea11411557c13457D4dA7dC6ea731B88a`) `approve()` with the address of StakeableVestingFactory and `amount`

- Create a new transaction that calls StakeableVestingFactory's `deployStakeableVesting()` with the vesting parameters

- Have the above transactions executed.
  Find the address of the newly deployed StakeableVesting contract from the transaction and give it to the beneficiary.
  You can also see `deriveStakeableVestingAddress()` from the StakeableVestingFactory tests.

## How to revoke a vesting?

- Create and execute a new transaction that calls the respective StakeableVesting's `setBeneficiary()` with the multisig's address, effectively cutting off the old `beneficiary` so that the following steps cannot be frontrun and griefed

- Call `stateAtPool()`.
  Skip to [_`unstaking` is zero_](#unstaking-is-zero) if it is.

- Wait until `unstakeScheduledFor` and call `unstakeAtPool()` using any wallet.

### _`unstaking` is zero_

- Call `stateAtPool()`.
  Skip to [_`staked` is zero_](#staked-is-zero) if it is.

- Create a new transaction that calls `scheduleUnstakeAtPool()` with `staked` as the amount and execute it.
  Call `stateAtPool()` again to get `unstakeScheduledFor`.

- Wait until `unstakeScheduledFor` and call `unstakeAtPool()` using any wallet.

### _`staked` is zero_

- Call `stateAtPool()`.
  If `unstaked` is not zero, create a new transaction that calls `withdrawAtPool()` with `unstaked` as the amount and execute it.

- Create a new transaction that calls `withdrawAsOwner()`, execute it.
