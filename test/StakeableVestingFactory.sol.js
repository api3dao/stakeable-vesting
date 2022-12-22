const ethers = require('hardhat').ethers;
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

describe('StakeableVestingFactory', function () {
  async function deployStakeableVestingFactory() {
    const accounts = await ethers.getSigners();
    const roles = {
      deployer: accounts[0],
      randomPerson: accounts[9],
    };
    const MockApi3TokenFactory = await ethers.getContractFactory('MockApi3Token', roles.deployer);
    const mockApi3Token = await MockApi3TokenFactory.deploy();
    const StakeableVestingFactoryFactory = await ethers.getContractFactory('StakeableVestingFactory', roles.deployer);
    const stakeableVestingFactory = await StakeableVestingFactoryFactory.deploy(mockApi3Token.address);
    return { roles, mockApi3Token, stakeableVestingFactory };
  }

  describe('constructor', function () {
    it('constructs', async function () {
      const { roles, mockApi3Token, stakeableVestingFactory } = await loadFixture(deployStakeableVestingFactory);
      const stakeableVestingImplementation = await stakeableVestingFactory.stakeableVestingImplementation();
      console.log(stakeableVestingImplementation);
      // TODO: Verify implementation deployment
    });
  });
});
