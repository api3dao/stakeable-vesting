const hre = require('hardhat');
const references = require('../deployments/references.json');

module.exports = async ({ deployments }) => {
  const StakeableVestingFactory = await deployments.get('StakeableVestingFactory');
  await hre.run('verify:verify', {
    address: StakeableVestingFactory.address,
    constructorArguments: [references.Api3Token, references.Api3Pool],
  });
  const stakeableVestingFactory = new hre.ethers.Contract(
    StakeableVestingFactory.address,
    StakeableVestingFactory.abi,
    hre.ethers.provider
  );
  const stakeableVestingImplementationAddress = await stakeableVestingFactory.stakeableVestingImplementation();
  await hre.run('verify:verify', {
    address: stakeableVestingImplementationAddress,
    constructorArguments: [references.Api3Token, references.Api3Pool],
  });
};
module.exports.tags = ['verify'];
