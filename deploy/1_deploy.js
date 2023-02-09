const hre = require('hardhat');
const references = require('../deployments/references.json');

module.exports = async ({ getUnnamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const accounts = await getUnnamedAccounts();

  const stakeableVestingFactory = await deploy('StakeableVestingFactory', {
    from: accounts[0],
    args: [references.Api3Token, references.Api3Pool],
    log: true,
    deterministicDeployment: hre.ethers.constants.HashZero,
  });
  log(`Deployed StakeableVestingFactory at ${stakeableVestingFactory.address}`);
};
module.exports.tags = ['deploy'];
