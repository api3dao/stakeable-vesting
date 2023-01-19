const { ethers, artifacts } = require('hardhat');
const helpers = require('@nomicfoundation/hardhat-network-helpers');
const { expect } = require('chai');
const { getVestingParameters } = require('./StakeableVesting.sol');

describe('StakeableVestingFactory', function () {
  function deriveStakeableVestingAddress(
    stakeableVestingFactoryAddress,
    stakeableVestingImplementationAddress,
    beneficiaryAddress,
    startTimestamp,
    endTimestamp,
    amount
  ) {
    return ethers.utils.getCreate2Address(
      stakeableVestingFactoryAddress,
      ethers.utils.solidityKeccak256(
        ['address', 'uint32', 'uint32', 'uint192'],
        [beneficiaryAddress, startTimestamp, endTimestamp, amount]
      ),
      ethers.utils.keccak256(
        ethers.utils.hexConcat([
          '0x3d602d80600a3d3981f3', // This is an optimized constructor implementation
          '0x363d3d373d3d3d363d73', // The rest is the minimal proxy contract as specified by EIP-1167
          stakeableVestingImplementationAddress,
          '0x5af43d82803e903d91602b57fd5bf3',
        ])
      )
    );
  }

  async function deployStakeableVestingFactory() {
    const accounts = await ethers.getSigners();
    const roles = {
      deployer: accounts[0],
      mockTimelockManager: accounts[1],
      owner: accounts[2],
      beneficiary: accounts[3],
      randomPerson: accounts[9],
    };
    const vestingParameters = getVestingParameters();
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
    return { roles, vestingParameters, mockApi3Token, api3Pool, stakeableVestingFactory };
  }

  describe('constructor', function () {
    context('Api3Token address is not zero', function () {
      context('Api3Pool address is not zero', function () {
        it('deploys with initialized StakeableVesting implementation', async function () {
          const { roles, vestingParameters, mockApi3Token, api3Pool, stakeableVestingFactory } =
            await helpers.loadFixture(deployStakeableVestingFactory);
          expect(await stakeableVestingFactory.api3Token()).to.equal(mockApi3Token.address);
          const stakeableVestingImplementationAddress = await stakeableVestingFactory.stakeableVestingImplementation();
          const eoaDeployedStakeableVesting = await (
            await ethers.getContractFactory('StakeableVesting', roles.deployer)
          ).deploy(mockApi3Token.address, api3Pool.address);
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
          expect(await stakeableVestingImplementation.api3Pool()).to.equal(api3Pool.address);
          expect(await stakeableVestingImplementation.owner()).to.equal(ethers.constants.AddressZero);
          expect(await stakeableVestingImplementation.beneficiary()).to.equal(
            '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF'
          );
          await expect(
            stakeableVestingImplementation.initialize(
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
          const { roles, mockApi3Token } = await helpers.loadFixture(deployStakeableVestingFactory);
          const StakeableVestingFactoryFactory = await ethers.getContractFactory(
            'StakeableVestingFactory',
            roles.deployer
          );
          await expect(
            StakeableVestingFactoryFactory.deploy(mockApi3Token.address, ethers.constants.AddressZero)
          ).to.be.revertedWith('Api3Pool address zero');
        });
      });
    });
    context('Api3Token address is zero', function () {
      it('reverts', async function () {
        const { roles, api3Pool } = await helpers.loadFixture(deployStakeableVestingFactory);
        const StakeableVestingFactoryFactory = await ethers.getContractFactory(
          'StakeableVestingFactory',
          roles.deployer
        );
        await expect(
          StakeableVestingFactoryFactory.deploy(ethers.constants.AddressZero, api3Pool.address)
        ).to.be.revertedWith('Api3Token address zero');
      });
    });
  });

  describe('deployStakeableVesting', function () {
    context('Amount is not zero', function () {
      context('Owner has approved at least the vesting amount', function () {
        context('Owner owns at least the vesting amount', function () {
          context('Beneficiary address is not zero', function () {
            context('Start timestamp is not zero', function () {
              context('End is later than start', function () {
                context('Same arguments were not used in a previous deployment', function () {
                  it('deploys initialized StakeableVesting', async function () {
                    const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } =
                      await helpers.loadFixture(deployStakeableVestingFactory);
                    const calculatedStakeableVestingAddress = deriveStakeableVestingAddress(
                      stakeableVestingFactory.address,
                      await stakeableVestingFactory.stakeableVestingImplementation(),
                      roles.beneficiary.address,
                      vestingParameters.startTimestamp,
                      vestingParameters.endTimestamp,
                      vestingParameters.amount
                    );

                    await mockApi3Token
                      .connect(roles.owner)
                      .approve(stakeableVestingFactory.address, vestingParameters.amount);
                    const stakeableVestingAddress = await stakeableVestingFactory
                      .connect(roles.owner)
                      .callStatic.deployStakeableVesting(
                        roles.beneficiary.address,
                        vestingParameters.startTimestamp,
                        vestingParameters.endTimestamp,
                        vestingParameters.amount
                      );
                    expect(stakeableVestingAddress).to.equal(calculatedStakeableVestingAddress);

                    await expect(
                      stakeableVestingFactory
                        .connect(roles.owner)
                        .deployStakeableVesting(
                          roles.beneficiary.address,
                          vestingParameters.startTimestamp,
                          vestingParameters.endTimestamp,
                          vestingParameters.amount
                        )
                    )
                      .to.emit(stakeableVestingFactory, 'DeployedStakeableVesting')
                      .withArgs(
                        roles.owner.address,
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
                    expect(await stakeableVesting.owner()).to.equal(roles.owner.address);
                    expect(await stakeableVesting.beneficiary()).to.equal(roles.beneficiary.address);
                    const vesting = await stakeableVesting.vesting();
                    expect(vesting.startTimestamp).to.equal(vestingParameters.startTimestamp);
                    expect(vesting.endTimestamp).to.equal(vestingParameters.endTimestamp);
                    expect(vesting.amount).to.equal(vestingParameters.amount);
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
                context('Same arguments were used in a previous deployment', function () {
                  it('reverts', async function () {
                    const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } =
                      await helpers.loadFixture(deployStakeableVestingFactory);
                    await mockApi3Token
                      .connect(roles.owner)
                      .approve(stakeableVestingFactory.address, vestingParameters.amount);
                    await stakeableVestingFactory
                      .connect(roles.owner)
                      .deployStakeableVesting(
                        roles.beneficiary.address,
                        vestingParameters.startTimestamp,
                        vestingParameters.endTimestamp,
                        vestingParameters.amount
                      );
                    await expect(
                      stakeableVestingFactory
                        .connect(roles.owner)
                        .deployStakeableVesting(
                          roles.beneficiary.address,
                          vestingParameters.startTimestamp,
                          vestingParameters.endTimestamp,
                          vestingParameters.amount
                        )
                    ).to.be.revertedWith('ERC1167: create2 failed');
                  });
                });
              });
              context('End is not later than start', function () {
                it('reverts', async function () {
                  const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } =
                    await helpers.loadFixture(deployStakeableVestingFactory);
                  await mockApi3Token
                    .connect(roles.owner)
                    .approve(stakeableVestingFactory.address, vestingParameters.amount);
                  await expect(
                    stakeableVestingFactory
                      .connect(roles.owner)
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
                const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } = await helpers.loadFixture(
                  deployStakeableVestingFactory
                );
                await mockApi3Token
                  .connect(roles.owner)
                  .approve(stakeableVestingFactory.address, vestingParameters.amount);
                await expect(
                  stakeableVestingFactory
                    .connect(roles.owner)
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
              const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } = await helpers.loadFixture(
                deployStakeableVestingFactory
              );
              await mockApi3Token
                .connect(roles.owner)
                .approve(stakeableVestingFactory.address, vestingParameters.amount);
              await expect(
                stakeableVestingFactory
                  .connect(roles.owner)
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
        context('Owner owns at least the vesting amount', function () {
          it('reverts', async function () {
            const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } = await helpers.loadFixture(
              deployStakeableVestingFactory
            );
            await mockApi3Token.connect(roles.owner).approve(stakeableVestingFactory.address, vestingParameters.amount);
            const ownerApi3TokenBalance = await mockApi3Token.balanceOf(roles.owner.address);
            await mockApi3Token
              .connect(roles.owner)
              .transfer(roles.randomPerson.address, ownerApi3TokenBalance.sub(vestingParameters.amount).add(1));
            await expect(
              stakeableVestingFactory
                .connect(roles.owner)
                .deployStakeableVesting(
                  roles.beneficiary.address,
                  vestingParameters.startTimestamp,
                  vestingParameters.endTimestamp,
                  vestingParameters.amount
                )
            ).to.be.revertedWith('ERC20: transfer amount exceeds balance');
          });
        });
      });
      context('Owner has not approved at least the vesting amount', function () {
        it('reverts', async function () {
          const { roles, vestingParameters, mockApi3Token, stakeableVestingFactory } = await helpers.loadFixture(
            deployStakeableVestingFactory
          );
          await mockApi3Token
            .connect(roles.owner)
            .approve(stakeableVestingFactory.address, vestingParameters.amount.sub(1));
          await expect(
            stakeableVestingFactory
              .connect(roles.owner)
              .deployStakeableVesting(
                roles.beneficiary.address,
                vestingParameters.startTimestamp,
                vestingParameters.endTimestamp,
                vestingParameters.amount
              )
          ).to.be.revertedWith('ERC20: insufficient allowance');
        });
      });
    });
    context('Amount is zero', function () {
      it('reverts', async function () {
        const { roles, vestingParameters, stakeableVestingFactory } = await helpers.loadFixture(
          deployStakeableVestingFactory
        );
        await expect(
          stakeableVestingFactory
            .connect(roles.owner)
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
});
