const { deployments } = require('hardhat');
const { deriveStakeableVestingAddress } = require('../src');

async function main() {
  const deployment = await deployments.get('StakeableVestingFactory');
  const stakeableVestingImplementationAddress = '0x79661fE75c0C0394787422FE56Eb05A4A4A8E884';
  const hotWalletMultisigAddress = '0x0C4030768601A5b564FCD50Ec5957D516b0F2aD4';
  console.log(
    deriveStakeableVestingAddress(
      deployment.address,
      stakeableVestingImplementationAddress,
      process.env.BENEFICIARY,
      process.env.START_TIMESTAMP,
      process.env.END_TIMESTAMP,
      process.env.AMOUNT,
      hotWalletMultisigAddress
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
