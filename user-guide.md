# Stakeable vesting user guide

There are two contracts:

- StakeableVesting: A contract that represents a vesting. It has a `beneficiary` (the account that is being vested) and
  an `owner` (the account that can revoke the vesting).

- StakeableVestingFactory: A contract that anyone can call to deploy a new StakeableVesting contract (i.e., create a new
  vesting). The caller provides the tokens to be vested and is set to be the `owner` of the deployed StakeableVesting
  contract.

## Beneficiary guide

If you are being vested tokens, that means you have a dedicated StakeableVesting contract. To act on your vesting
(stake, withdraw, etc.) you need to interact with this contract using your `beneficiary` account (i.e., the wallet whose
address you have provided for the tokens to be vested for). This contract will sit between `beneficiary` and the API3
staking pool, which means as far as the staking pool is concerned, the address that identifies you is your
StakeableVesting contract address. In short, you do two things:

- Send transactions to your StakeableVesting contract using your `beneficiary` account to take actions (stake, withdraw,
  etc.)
- Fetch your status from the API3 staking pool contract using the address of your StakeableVesting contract

### ⚠️ Important warnings ⚠️

- You will need to be able to interact with a contract through your `beneficiary` account. This means you have to be
  able to connect it to Metamask. It cannot be a custodial wallet, e.g., do not use the deposit address of a crypto
  exchange deposit address.

- You are recommended to use a hardware wallet for your `beneficiary` account

- Whenever you are sending transactions to your StakeableVesting contract, verify on the interface of your wallet (or
  hardware wallet if you are using one) that the address to which the transaction is being sent matches your
  StakeableVesting contract address

- `owner` of your StakeableVesting contract is allowed to revoke your tokens in your StakeableVesting contract or tokens
  that are transferred to Api3Pool by your StakeableVesting contract, even if they are already vested. To trustlessly
  own your vested tokens, make a habit to periodically withdraw them.

### StakeableVesting interface

Search the address of the StakeableVesting contract on Etherscan. Click "Contract" and then "Read Contract" to use the
following interface.

- `unvestedAmount()`: Amount of tokens that are still not yet vested. The beneficiary always has to keep at least this
  amount in StakeableVesting and Api3Pool combined (i.e., StakeableVesting will not let the beneficiary withdraw an
  amount that will break this rule).

- `beneficiary()`: The `beneficiary` account that is allowed to send transactions to this contract. If this does not
  match the address you have expected, you are either looking at the wrong contract or your vesting has been revoked.

- `vesting()`: The parameters of your vesting

Search the address of the StakeableVesting contract on Etherscan. Click "Contract", click "Write Contract", click
"Connect to Web3" and use Metamask to connect your `beneficiary` wallet. Then, use the following interface:

- `withdrawAsBeneficiary()`: Withdraws all withdrawable (i.e., already vested) tokens from StakeableVesting to
  `beneficiary`. See `unvestedAmount()` above about how much this will allow to be withdrawn.

- `depositAtPool(amount)`: Deposits `amount` tokens (in Wei) from StakeableVesting to Api3Pool. These tokens will move
  from StakeableVesting balance to `user.unstaked` at Api3Pool.

- `withdrawAtPool(amount)`: Withdraws `amount` tokens from Api3Pool to StakeableVesting. These tokens will move from
  `user.unstaked` at Api3Pool to StakeableVesting balance.

- `stakeAtPool(amount)`: Stakes `amount` tokens of StakeableVesting at Api3Pool. These tokens will move from
  `user.unstaked` to `userStake()`.

- `scheduleUnstakeAtPool(amount)`: Schedules to unstake `amount` tokens of StakeableVesting at Api3Pool. These tokens
  will move from `userStake()` to `user.unstakeAmount`. You can see the time after which the unstaking can be executed
  at `user.unstakeScheduledFor`.

- `unstakeAtPool()`: Executes an unstaking scheduled by `scheduleUnstakeAtPool(amount)`. These tokens will move from
  `user.unstakeAmount` to `user.unstaked`.

- `delegateAtPool(delegate)`: Delegates voting power to `delegate`

- `undelegateAtPool()`: Undelegates voting power

Api3Pool limits StakeableVesting by the same rules it limits any other user. For example, after you call
`scheduleUnstakeAtPool(amount)`, you have to wait for a week (at the time this is being written) before you can call
`unstakeAtPool()`. Similarly, after you call `delegateAtPool(delegate)`, you have to wait for a week before you can call
`delegateAtPool(delegate)` again. If you are unable to take an action because the corresponding transaction will revert,
this is probably because of such a rule.

## Api3Pool interface

Each beneficiary has a StakeableVesting contract. Use the address of this contract with Api3Pool to get the respective
information.

- [`userDelegate(stakeableVestingAddress)`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F26):
  Who the user has delegated to
- [`userLocked(stakeableVestingAddress)`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F28):
  The amount of staking rewards that are timelocked (do not confuse this with the vesting)
- [`userStake(stakeableVestingAddress)`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F31):
  The amount of staked tokens
- [`users(stakeableVestingAddress)`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F36):
  The amount of unstaked tokens, unstaking information, when the delegation was last updated (ignore `vesting` here,
  that is related to tokens transferred from TimelockManager)

## Owner guide

This guide is written for users that will grant vestings, i.e., hot wallet multisig signers.

### How to create a new vesting?

- Determine the vesting parameters

  - `beneficiary` is the address of the recipient
  - `startTimestamp` is the time the vesting will start in Unix time. You can use an online tool (such as
    https://www.unixtimestamp.com/) to do the conversion. Make sure to provide the date you intended to use for the
    other multisig signers to be able to confirm. `startTimestamp` can be in the past.
  - `endTimestamp` is the time the vesting will end in Unix time.
  - `amount` is the total amount of API3 tokens to be vested in Wei.

- Confirm that the multisig has at least `amount` API3 tokens

- Create a new transaction that calls the API3 token contract's (`0x0b38210ea11411557c13457D4dA7dC6ea731B88a`)
  `approve()` with the address of StakeableVestingFactory and `amount`

- Create a new transaction that calls StakeableVestingFactory's `deployStakeableVesting()` with the vesting parameters

- Have the above transactions executed. Find the address of the newly deployed StakeableVesting contract from the last
  transaction and give it to the beneficiary. You can also see `deriveStakeableVestingAddress()` from the
  StakeableVestingFactory tests.

### How to revoke a vesting?

- Inform the beneficiary when their vesting will be revoked to allow them to unstake and withdraw the already vested
  tokens

- After the revocation date above, create and execute a new transaction that calls the respective StakeableVesting's
  `setBeneficiary()` with the multisig's address, effectively cutting off the old `beneficiary` so that the following
  steps cannot be frontrun and griefed

- Call the API3 staking pool contract's
  [`userStake()`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F31) and
  [`users()`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F36). If the first
  call and `unstakeAmount` from the second call are zero, create a new transaction that calls StakeableVesting's
  `withdrawAsOwner()`, execute it and you are done. If any of these numbers is not zero, continue following the steps
  below.

- If `unstakeAmount` was not zero, wait until `unstakeScheduledFor` from the same call. After `unstakeScheduledFor`,
  call StakeableVesting's `unstakeAtPool()` using any wallet (does not have to be the multisig).

- Call the API3 staking pool contract's
  [`users()`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F36) to confirm that
  `unstakeAmount` is zero. Call the API3 staking pool contract's
  [`userStake()`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F31). Create a
  new transaction that calls StakeableVesting's `scheduleUnstakeAtPool()` with the staked amount and execute it. Call
  [`users()`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F36) to get
  `unstakeScheduledFor`.

- After `unstakeScheduledFor`, call StakeableVesting's `unstakeAtPool()` using any wallet.

- Call [`users()`](https://etherscan.io/address/0x6dd655f10d4b9e242ae186d9050b68f725c76d76#readContract#F36) to confirm
  that `unstakeAmount` is zero. Create a new transaction that calls StakeableVesting's `withdrawAsOwner()`, execute it.
