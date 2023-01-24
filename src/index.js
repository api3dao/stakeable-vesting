const ethers = require('ethers');

module.exports = {
  deriveStakeableVestingAddress: (
    stakeableVestingFactoryAddress,
    stakeableVestingImplementationAddress,
    beneficiaryAddress,
    startTimestamp,
    endTimestamp,
    amount
  ) => {
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
  },
};
