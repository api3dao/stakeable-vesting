const ethers = require('hardhat').ethers;
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

describe('StakeableVesting', function () {
  async function deployStakeableVesting() {
    const accounts = await ethers.getSigners();
    const roles = {
      deployer: accounts[0],
      randomPerson: accounts[9],
    };
    const MockApi3TokenFactory = await ethers.getContractFactory('MockApi3Token', roles.deployer);
    const mockApi3Token = await MockApi3TokenFactory.deploy();
    const StakeableVestingFactory = await ethers.getContractFactory('StakeableVesting', roles.deployer);
    const stakeableVesting = await StakeableVestingFactory.deploy(mockApi3Token.address);
    return { roles, mockApi3Token, stakeableVesting };
  }

  describe('constructor', function () {
    it('constructs uninitialized stakeable vesting', async function () {
      const { roles, mockApi3Token, stakeableVesting } = await loadFixture(deployStakeableVesting);
      expect(await stakeableVesting.owner()).to.equal(roles.deployer.address);
      expect(await stakeableVesting.token()).to.equal(mockApi3Token.address);
      expect(await stakeableVesting.beneficiary()).to.equal(ethers.constants.AddressZero);
    });
  });
});
