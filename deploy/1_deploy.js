const hre = require('hardhat');

module.exports = async ({ getUnnamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const accounts = await getUnnamedAccounts();

  const stakeableVestingFactory = await deploy('StakeableVestingFactory', {
    from: accounts[0],
    args: ['0x0b38210ea11411557c13457D4dA7dC6ea731B88a', '0x6dd655f10d4b9E242aE186D9050B68F725c76d76'],
    log: true,
    deterministicDeployment: hre.ethers.constants.HashZero,
  });
  log(`Deployed StakeableVestingFactory at ${stakeableVestingFactory.address}`);
};
module.exports.tags = ['deploy'];
