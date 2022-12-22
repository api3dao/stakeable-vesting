const { ethers, artifacts } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

describe('StakeableVestingFactory', function () {
  async function deployStakeableVestingFactory() {
    const accounts = await ethers.getSigners();
    const roles = {
      deployer: accounts[0],
      beneficiary: accounts[1],
      randomPerson: accounts[9],
    };
    const MockApi3TokenFactory = await ethers.getContractFactory('MockApi3Token', roles.deployer);
    const mockApi3Token = await MockApi3TokenFactory.deploy();
    const StakeableVestingFactoryFactory = await ethers.getContractFactory('StakeableVestingFactory', roles.deployer);
    const stakeableVestingFactory = await StakeableVestingFactoryFactory.deploy(mockApi3Token.address);
    return { roles, mockApi3Token, stakeableVestingFactory };
  }

  describe('constructor', function () {
    it('deploys initialized StakeableVesting implementation', async function () {
      const { roles, mockApi3Token, stakeableVestingFactory } = await loadFixture(deployStakeableVestingFactory);
      const stakeableVestingImplementationAddress = await stakeableVestingFactory.stakeableVestingImplementation();
      const StakeableVesting = await artifacts.readArtifact('StakeableVesting');
      const stakeableVestingImplementation = new ethers.Contract(
        stakeableVestingImplementationAddress,
        StakeableVesting.abi,
        roles.deployer
      );
      expect(await stakeableVestingImplementation.token()).to.equal(mockApi3Token.address);
      expect(await stakeableVestingImplementation.owner()).to.equal(ethers.constants.AddressZero);
      expect(await stakeableVestingImplementation.beneficiary()).to.equal('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF');
      await expect(
        stakeableVestingImplementation.initialize(roles.deployer.address, roles.beneficiary.address)
      ).to.be.revertedWith('Already initialized');
      // TODO: Verify implementation deployment
    });
  });

  describe('deployStakeableVesting', function () {
    it('deploys initialized StakeableVesting', async function () {
      const { roles, mockApi3Token, stakeableVestingFactory } = await loadFixture(deployStakeableVestingFactory);
      const stakeableVestingAddress = await stakeableVestingFactory
        .connect(roles.deployer)
        .callStatic.deployStakeableVesting(roles.beneficiary.address);
      await stakeableVestingFactory.connect(roles.deployer).deployStakeableVesting(roles.beneficiary.address);
      const StakeableVesting = await artifacts.readArtifact('StakeableVesting');
      const stakeableVesting = new ethers.Contract(stakeableVestingAddress, StakeableVesting.abi, roles.deployer);
      expect(await stakeableVesting.token()).to.equal(mockApi3Token.address);
      expect(await stakeableVesting.owner()).to.equal(roles.deployer.address);
      expect(await stakeableVesting.beneficiary()).to.equal(roles.beneficiary.address);
      await expect(stakeableVesting.initialize(roles.deployer.address, roles.beneficiary.address)).to.be.revertedWith(
        'Already initialized'
      );
    });
  });
});
