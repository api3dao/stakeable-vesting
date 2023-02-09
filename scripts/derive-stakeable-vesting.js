const { deployments } = require('hardhat');
const { deriveStakeableVestingAddress } = require('../src');

async function main() {
  const deployment = await deployments.get('StakeableVestingFactory');
  const stakeableVestingImplementationAddress = '0x761aF4f3dCD81051cCBF3CF3fDA27E8c12f8a2D1';
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
