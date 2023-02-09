const hre = require('hardhat');
const references = require('../deployments/references.json');

module.exports = async ({ deployments }) => {
  const StakeableVestingFactory = await deployments.get('StakeableVestingFactory');
  await hre.run('verify:verify', {
    address: StakeableVestingFactory.address,
    constructorArguments: [references.Api3Token, references.Api3Pool],
  });
};
module.exports.tags = ['verify'];
