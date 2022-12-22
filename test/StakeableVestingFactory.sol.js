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
    const vestingParameters = {
      startTimestamp: new Date(Date.parse('2023-01-01')).getTime() / 1000,
      endTimestamp: new Date(Date.parse('2027-01-01')).getTime() / 1000,
      amount: ethers.utils.parseEther('100' + '000'),
    };
    const MockApi3TokenFactory = await ethers.getContractFactory('MockApi3Token', roles.deployer);
    const mockApi3Token = await MockApi3TokenFactory.deploy();
    const StakeableVestingFactoryFactory = await ethers.getContractFactory('StakeableVestingFactory', roles.deployer);
    const stakeableVestingFactory = await StakeableVestingFactoryFactory.deploy(mockApi3Token.address);
    return { roles, vestingParameters, mockApi3Token, stakeableVestingFactory };
  }

  describe('constructor', function () {
    context('Api3Token address is not zero', function () {
      it('deploys with initialized StakeableVesting implementation', async function () {
        const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } = await loadFixture(
          deployStakeableVestingFactory
        );
        expect(await stakeableVestingFactory.api3Token()).to.equal(mockApi3Token.address);
        const stakeableVestingImplementationAddress = await stakeableVestingFactory.stakeableVestingImplementation();
        const eoaDeployedStakeableVesting = await (
          await ethers.getContractFactory('StakeableVesting', roles.deployer)
        ).deploy(mockApi3Token.address);
        expect(await ethers.provider.getCode(stakeableVestingImplementationAddress)).to.equal(
          await ethers.provider.getCode(eoaDeployedStakeableVesting.address)
        );

        const StakeableVesting = await artifacts.readArtifact('StakeableVesting');
        const stakeableVestingImplementation = new ethers.Contract(
          stakeableVestingImplementationAddress,
          StakeableVesting.abi,
          roles.deployer
        );
        expect(await stakeableVestingImplementation.api3Token()).to.equal(mockApi3Token.address);
        expect(await stakeableVestingImplementation.owner()).to.equal(ethers.constants.AddressZero);
        expect(await stakeableVestingImplementation.beneficiary()).to.equal(
          '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'
        );
        await expect(
          stakeableVestingImplementation.initialize(
            roles.deployer.address,
            roles.beneficiary.address,
            vestingParameters.startTimestamp,
            vestingParameters.endTimestamp,
            vestingParameters.amount
          )
        ).to.be.revertedWith('Already initialized');
      });
    });
    context('Api3Token address is zero', function () {
      it('reverts', async function () {
        const { roles } = await loadFixture(deployStakeableVestingFactory);
        const StakeableVestingFactoryFactory = await ethers.getContractFactory(
          'StakeableVestingFactory',
          roles.deployer
        );
        await expect(StakeableVestingFactoryFactory.deploy(ethers.constants.AddressZero)).to.be.revertedWith(
          'Api3Token address zero'
        );
      });
    });
  });

  describe('deployStakeableVesting', function () {
    context('Owner address is not zero', function () {
      context('Beneficiary address is not zero', function () {
        context('Start timestamp is not zero', function () {
          context('End is later than start', function () {
            context('Amount is not zero', function () {
              it('deploys initialized StakeableVesting', async function () {
                const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } = await loadFixture(
                  deployStakeableVestingFactory
                );
                const stakeableVestingAddress = await stakeableVestingFactory
                  .connect(roles.deployer)
                  .callStatic.deployStakeableVesting(
                    roles.beneficiary.address,
                    vestingParameters.startTimestamp,
                    vestingParameters.endTimestamp,
                    vestingParameters.amount
                  );
                await expect(
                  stakeableVestingFactory
                    .connect(roles.deployer)
                    .deployStakeableVesting(
                      roles.beneficiary.address,
                      vestingParameters.startTimestamp,
                      vestingParameters.endTimestamp,
                      vestingParameters.amount
                    )
                )
                  .to.emit(stakeableVestingFactory, 'DeployedStakeableVesting')
                  .withArgs(
                    roles.deployer.address,
                    roles.beneficiary.address,
                    vestingParameters.startTimestamp,
                    vestingParameters.endTimestamp,
                    vestingParameters.amount
                  );

                const StakeableVesting = await artifacts.readArtifact('StakeableVesting');
                const stakeableVesting = new ethers.Contract(
                  stakeableVestingAddress,
                  StakeableVesting.abi,
                  roles.deployer
                );
                expect(await stakeableVesting.api3Token()).to.equal(mockApi3Token.address);
                expect(await stakeableVesting.owner()).to.equal(roles.deployer.address);
                expect(await stakeableVesting.beneficiary()).to.equal(roles.beneficiary.address);
                const vesting = await stakeableVesting.vesting();
                expect(vesting.startTimestamp).to.equal(vestingParameters.startTimestamp);
                expect(vesting.endTimestamp).to.equal(vestingParameters.endTimestamp);
                expect(vesting.amount).to.equal(vestingParameters.amount);
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
            context('Amount is zero', function () {
              it('reverts', async function () {
                const { roles, vestingParameters, stakeableVestingFactory } = await loadFixture(
                  deployStakeableVestingFactory
                );
                await expect(
                  stakeableVestingFactory
                    .connect(roles.deployer)
                    .deployStakeableVesting(
                      roles.beneficiary.address,
                      vestingParameters.startTimestamp,
                      vestingParameters.endTimestamp,
                      0
                    )
                ).to.be.revertedWith('Amount zero');
              });
            });
          });
          context('End is not later than start', function () {
            it('reverts', async function () {
              const { roles, vestingParameters, stakeableVestingFactory } = await loadFixture(
                deployStakeableVestingFactory
              );
              await expect(
                stakeableVestingFactory
                  .connect(roles.deployer)
                  .deployStakeableVesting(
                    roles.beneficiary.address,
                    vestingParameters.startTimestamp,
                    vestingParameters.startTimestamp,
                    vestingParameters.amount
                  )
              ).to.be.revertedWith('End not later than start');
            });
          });
        });
        context('Start timestamp is zero', function () {
          it('reverts', async function () {
            const { roles, vestingParameters, stakeableVestingFactory } = await loadFixture(
              deployStakeableVestingFactory
            );
            await expect(
              stakeableVestingFactory
                .connect(roles.deployer)
                .deployStakeableVesting(
                  roles.beneficiary.address,
                  0,
                  vestingParameters.endTimestamp,
                  vestingParameters.amount
                )
            ).to.be.revertedWith('Start timestamp zero');
          });
        });
      });
      context('Beneficiary address is zero', function () {
        it('reverts', async function () {
          const { roles, vestingParameters, stakeableVestingFactory } = await loadFixture(
            deployStakeableVestingFactory
          );
          await expect(
            stakeableVestingFactory
              .connect(roles.deployer)
              .deployStakeableVesting(
                ethers.constants.AddressZero,
                vestingParameters.startTimestamp,
                vestingParameters.endTimestamp,
                vestingParameters.amount
              )
          ).to.be.revertedWith('Beneficiary address zero');
        });
      });
    });
    context('Owner address is zero', function () {
      it('reverts', async function () {
        // This is impossible to test with the current StakeableVestingFactory implementation
        const { vestingParameters, stakeableVestingFactory } = await loadFixture(deployStakeableVestingFactory);
        const voidSignerAddressZero = new ethers.VoidSigner(ethers.constants.AddressZero, ethers.provider);
        await expect(
          stakeableVestingFactory
            .connect(voidSignerAddressZero)
            .callStatic.deployStakeableVesting(
              ethers.constants.AddressZero,
              vestingParameters.startTimestamp,
              vestingParameters.endTimestamp,
              vestingParameters.amount
            )
        ).to.be.revertedWith('Owner address zero');
      });
    });
  });
});
