const { ethers, artifacts } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');

describe('StakeableVesting', function () {
  async function eoaDeployStakeableVesting() {
    const accounts = await ethers.getSigners();
    const roles = {
      deployer: accounts[0],
      mockTimelockManager: accounts[1],
      owner: accounts[2],
      beneficiary: accounts[3],
      randomPerson: accounts[9],
    };
    const vestingParameters = {
      startTimestamp: new Date(Date.parse('2023-01-01')).getTime() / 1000,
      endTimestamp: new Date(Date.parse('2027-01-01')).getTime() / 1000,
      amount: ethers.utils.parseEther('100' + '000'),
    };
    const MockApi3TokenFactory = await ethers.getContractFactory('MockApi3Token', roles.deployer);
    const mockApi3Token = await MockApi3TokenFactory.deploy();
    await mockApi3Token
      .connect(roles.deployer)
      .transfer(roles.owner.address, await mockApi3Token.balanceOf(roles.deployer.address));
    const Api3PoolFactory = await ethers.getContractFactory('Api3Pool', roles.deployer);
    const api3Pool = await Api3PoolFactory.deploy(mockApi3Token.address, roles.mockTimelockManager.address);
    const StakeableVestingFactory = await ethers.getContractFactory('StakeableVesting', roles.deployer);
    const stakeableVesting = await StakeableVestingFactory.deploy(mockApi3Token.address, api3Pool.address);
    return { roles, vestingParameters, mockApi3Token, api3Pool, stakeableVesting };
  }

  async function factoryDeployStakeableVesting() {
    const accounts = await ethers.getSigners();
    const roles = {
      deployer: accounts[0],
      owner: accounts[1],
      mockTimelockManager: accounts[2],
      beneficiary: accounts[3],
      randomPerson: accounts[9],
    };
    const vestingParameters = {
      startTimestamp: new Date(Date.parse('2023-01-01')).getTime() / 1000,
      endTimestamp: new Date(Date.parse('2027-01-01')).getTime() / 1000,
      amount: ethers.utils.parseEther('100' + '000'),
    };
    const MockApi3TokenFactory = await ethers.getContractFactory('MockApi3Token', roles.deployer);
    const mockApi3Token = await MockApi3TokenFactory.deploy();
    await mockApi3Token
      .connect(roles.deployer)
      .transfer(roles.owner.address, await mockApi3Token.balanceOf(roles.deployer.address));
    const Api3PoolFactory = await ethers.getContractFactory('Api3Pool', roles.deployer);
    const api3Pool = await Api3PoolFactory.deploy(mockApi3Token.address, roles.mockTimelockManager.address);
    const StakeableVestingFactoryFactory = await ethers.getContractFactory('StakeableVestingFactory', roles.deployer);
    const stakeableVestingFactory = await StakeableVestingFactoryFactory.deploy(
      mockApi3Token.address,
      api3Pool.address
    );
    await mockApi3Token.connect(roles.owner).approve(stakeableVestingFactory.address, vestingParameters.amount);
    const stakeableVestingAddress = await stakeableVestingFactory
      .connect(roles.owner)
      .callStatic.deployStakeableVesting(
        roles.beneficiary.address,
        vestingParameters.startTimestamp,
        vestingParameters.endTimestamp,
        vestingParameters.amount
      );
    await stakeableVestingFactory
      .connect(roles.owner)
      .deployStakeableVesting(
        roles.beneficiary.address,
        vestingParameters.startTimestamp,
        vestingParameters.endTimestamp,
        vestingParameters.amount
      );
    const StakeableVesting = await artifacts.readArtifact('StakeableVesting');
    const stakeableVesting = new ethers.Contract(stakeableVestingAddress, StakeableVesting.abi, roles.deployer);
    return { roles, vestingParameters, mockApi3Token, api3Pool, stakeableVesting };
  }

  describe('constructor', function () {
    context('Api3Token address is not zero', function () {
      context('Api3Pool address is not zero', function () {
        it('constructs uninitializable StakeableVesting', async function () {
          const { roles, vestingParameters, mockApi3Token, api3Pool, stakeableVesting } = await loadFixture(
            eoaDeployStakeableVesting
          );
          expect(await stakeableVesting.owner()).to.equal(ethers.constants.AddressZero);
          expect(await stakeableVesting.api3Token()).to.equal(mockApi3Token.address);
          expect(await stakeableVesting.api3Pool()).to.equal(api3Pool.address);
          expect(await stakeableVesting.beneficiary()).to.equal('0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF');
          await expect(
            stakeableVesting.initialize(
              roles.owner.address,
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
          const { roles, mockApi3Token } = await loadFixture(eoaDeployStakeableVesting);
          const StakeableVestingFactory = await ethers.getContractFactory('StakeableVesting', roles.deployer);
          await expect(
            StakeableVestingFactory.deploy(mockApi3Token.address, ethers.constants.AddressZero)
          ).to.be.revertedWith('Api3Pool address zero');
        });
      });
    });
    context('Api3Token address is zero', function () {
      it('reverts', async function () {
        const { roles, api3Pool } = await loadFixture(eoaDeployStakeableVesting);
        const StakeableVestingFactory = await ethers.getContractFactory('StakeableVesting', roles.deployer);
        await expect(StakeableVestingFactory.deploy(ethers.constants.AddressZero, api3Pool.address)).to.be.revertedWith(
          'Api3Token address zero'
        );
      });
    });
  });

  // See StakeableVestingFactory tests for the happy path
  describe('initialize', function () {
    context('Owner address is zero', function () {
      it('reverts', async function () {
        const { roles, vestingParameters, mockApi3Token, api3Pool } = await loadFixture(eoaDeployStakeableVesting);
        const BadStakeableVestingFactoryFactory = await ethers.getContractFactory(
          'BadStakeableVestingFactory',
          roles.deployer
        );
        const badStakeableVestingFactory = await BadStakeableVestingFactoryFactory.deploy(
          mockApi3Token.address,
          api3Pool.address
        );
        await mockApi3Token.connect(roles.owner).approve(badStakeableVestingFactory.address, vestingParameters.amount);
        await expect(
          badStakeableVestingFactory
            .connect(roles.owner)
            .deployStakeableVestingWithZeroOwner(
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
        const { roles, vestingParameters, mockApi3Token, api3Pool } = await loadFixture(eoaDeployStakeableVesting);
        const BadStakeableVestingFactoryFactory = await ethers.getContractFactory(
          'BadStakeableVestingFactory',
          roles.deployer
        );
        const badStakeableVestingFactory = await BadStakeableVestingFactoryFactory.deploy(
          mockApi3Token.address,
          api3Pool.address
        );
        await expect(
          badStakeableVestingFactory
            .connect(roles.owner)
            .deployStakeableVestingWithoutTransferringTokens(
              roles.beneficiary.address,
              vestingParameters.startTimestamp,
              vestingParameters.endTimestamp,
              vestingParameters.amount
            )
        ).to.be.revertedWith('Balance is not vesting amount');
      });
    });
  });

  describe('setBeneficiary', function () {
    context('Sender is owner', function () {
      context('Beneficiary address is not zero', function () {
        it('sets beneficiary', async function () {
          const { roles, stakeableVesting } = await loadFixture(factoryDeployStakeableVesting);
          await expect(stakeableVesting.connect(roles.owner).setBeneficiary(roles.randomPerson.address))
            .to.emit(stakeableVesting, 'SetBeneficiary')
            .withArgs(roles.randomPerson.address);
          expect(await stakeableVesting.beneficiary()).to.equal(roles.randomPerson.address);
        });
      });
      context('Beneficiary address is zero', function () {
        it('reverts', async function () {
          const { roles, stakeableVesting } = await loadFixture(factoryDeployStakeableVesting);
          await expect(
            stakeableVesting.connect(roles.owner).setBeneficiary(ethers.constants.AddressZero)
          ).to.be.revertedWith('Beneficiary address zero');
        });
      });
    });
    context('Sender is not owner', function () {
      it('reverts', async function () {
        const { roles, stakeableVesting } = await loadFixture(factoryDeployStakeableVesting);
        await expect(
          stakeableVesting.connect(roles.randomPerson).setBeneficiary(roles.randomPerson.address)
        ).to.be.revertedWith('Ownable: caller is not the owner');
      });
    });
  });

  describe('withdrawAsOwner', function () {
    context('Sender is owner', function () {
      context('Balance is not zero', function () {
        it('withdraws', async function () {
          const { roles, vestingParameters, mockApi3Token, stakeableVesting } = await loadFixture(
            factoryDeployStakeableVesting
          );
          const ownerBalanceBeforeWithdrawal = await mockApi3Token.balanceOf(roles.owner.address);
          await expect(stakeableVesting.connect(roles.owner).withdrawAsOwner())
            .to.emit(stakeableVesting, 'WithdrawnAsOwner')
            .withArgs(vestingParameters.amount);
          const ownerBalanceAfterWithdrawal = await mockApi3Token.balanceOf(roles.owner.address);
          expect(ownerBalanceAfterWithdrawal.sub(ownerBalanceBeforeWithdrawal)).to.equal(vestingParameters.amount);
          expect(await mockApi3Token.balanceOf(stakeableVesting.address)).to.equal(0);
        });
      });
      context('Balance is zero', function () {
        it('reverts', async function () {
          const { roles, stakeableVesting } = await loadFixture(factoryDeployStakeableVesting);
          await stakeableVesting.connect(roles.owner).withdrawAsOwner();
          await expect(stakeableVesting.connect(roles.owner).withdrawAsOwner()).to.be.revertedWith(
            'No balance to withdraw'
          );
        });
      });
    });
    context('Sender is not owner', function () {
      it('reverts', async function () {
        const { roles, stakeableVesting } = await loadFixture(factoryDeployStakeableVesting);
        await expect(stakeableVesting.connect(roles.randomPerson).withdrawAsOwner()).to.be.revertedWith(
          'Ownable: caller is not the owner'
        );
      });
    });
  });
});
