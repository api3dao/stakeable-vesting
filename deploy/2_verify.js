const hre = require('hardhat');

module.exports = async ({ deployments }) => {
  const StakeableVestingFactory = await deployments.get('StakeableVestingFactory');
  await hre.run('verify:verify', {
    address: StakeableVestingFactory.address,
    constructorArguments: ['0x0b38210ea11411557c13457D4dA7dC6ea731B88a', '0x6dd655f10d4b9E242aE186D9050B68F725c76d76'],
  });
};
module.exports.tags = ['verify'];
