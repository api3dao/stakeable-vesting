const ethers = require('hardhat').ethers;
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

describe('StakeableVesting', function () {
  async function deployStakeableVesting() {
    const accounts = await ethers.getSigners();
    const roles = {
      deployer: accounts[0],
      beneficiary: accounts[1],
      randomPerson: accounts[9],
    };
    const vestingParameters = {
      startTimestamp: new Date(Date.parse('2023-01-01')).getTime() / 1000,
      endTimestamp: new Date(Date.parse('2027-01-01')).getTime() / 1000,
      amount: ethers.utils.parseEther('100' + '000'),
    };
    const MockApi3TokenFactory = await ethers.getContractFactory('MockApi3Token', roles.deployer);
    const mockApi3Token = await MockApi3TokenFactory.deploy();
    const MockApi3PoolFactory = await ethers.getContractFactory('MockApi3Pool', roles.deployer);
    const mockApi3Pool = await MockApi3PoolFactory.deploy();
    const StakeableVestingFactory = await ethers.getContractFactory('StakeableVesting', roles.deployer);
    const stakeableVesting = await StakeableVestingFactory.deploy(mockApi3Token.address, mockApi3Pool.address);
    return { roles, vestingParameters, mockApi3Token, mockApi3Pool, stakeableVesting };
  }

  describe('constructor', function () {
    context('Api3Token address is not zero', function () {
      context('Api3Pool address is not zero', function () {
        it('constructs uninitializable StakeableVesting', async function () {
          const { roles, vestingParameters, mockApi3Token, mockApi3Pool, stakeableVesting } = await loadFixture(
            deployStakeableVesting
          );
          expect(await stakeableVesting.owner()).to.equal(ethers.constants.AddressZero);
          expect(await stakeableVesting.api3Token()).to.equal(mockApi3Token.address);
          expect(await stakeableVesting.api3Pool()).to.equal(mockApi3Pool.address);
          expect(await stakeableVesting.beneficiary()).to.equal('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF');
          await expect(
            stakeableVesting.initialize(
              roles.deployer.address,
              roles.beneficiary.address,
              vestingParameters.startTimestamp,
              vestingParameters.endTimestamp,
              vestingParameters.amount
            )
          ).to.be.revertedWith('Already initialized');
        });
      });
      context('Api3Pool address is zero', function () {
        it('reverts', async function () {
          const { roles, mockApi3Token } = await loadFixture(deployStakeableVesting);
          const StakeableVestingFactory = await ethers.getContractFactory('StakeableVesting', roles.deployer);
          await expect(
            StakeableVestingFactory.deploy(mockApi3Token.address, ethers.constants.AddressZero)
          ).to.be.revertedWith('Api3Pool address zero');
        });
      });
    });
    context('Api3Token address is zero', function () {
      it('reverts', async function () {
        const { roles, mockApi3Pool } = await loadFixture(deployStakeableVesting);
        const StakeableVestingFactory = await ethers.getContractFactory('StakeableVesting', roles.deployer);
        await expect(
          StakeableVestingFactory.deploy(ethers.constants.AddressZero, mockApi3Pool.address)
        ).to.be.revertedWith('Api3Token address zero');
      });
    });
  });

  describe('initialize', function () {
    context('Owner address is zero', function () {
      it('reverts', async function () {
        const { roles, vestingParameters, mockApi3Token, mockApi3Pool } = await loadFixture(deployStakeableVesting);
        const BadStakeableVestingFactoryFactory = await ethers.getContractFactory(
          'BadStakeableVestingFactory',
          roles.deployer
        );
        const badStakeableVestingFactory = await BadStakeableVestingFactoryFactory.deploy(
          mockApi3Token.address,
          mockApi3Pool.address
        );
        await mockApi3Token
          .connect(roles.deployer)
          .approve(badStakeableVestingFactory.address, vestingParameters.amount);
        await expect(
          badStakeableVestingFactory.deployStakeableVestingWithZeroOwner(
            roles.beneficiary.address,
            vestingParameters.startTimestamp,
            vestingParameters.endTimestamp,
            vestingParameters.amount
          )
        ).to.be.revertedWith('Owner address zero');
      });
    });
    context('Token balance is not equal to vesting amount', function () {
      it('reverts', async function () {
        const { roles, vestingParameters, mockApi3Token, mockApi3Pool } = await loadFixture(deployStakeableVesting);
        const BadStakeableVestingFactoryFactory = await ethers.getContractFactory(
          'BadStakeableVestingFactory',
          roles.deployer
        );
        const badStakeableVestingFactory = await BadStakeableVestingFactoryFactory.deploy(
          mockApi3Token.address,
          mockApi3Pool.address
        );
        await expect(
          badStakeableVestingFactory.deployStakeableVestingWithoutTransferringTokens(
            roles.beneficiary.address,
            vestingParameters.startTimestamp,
            vestingParameters.endTimestamp,
            vestingParameters.amount
          )
        ).to.be.revertedWith('Balance is not vesting amount');
      });
    });
  });
});
