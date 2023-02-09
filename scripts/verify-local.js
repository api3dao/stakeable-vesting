const { deployments, ethers } = require('hardhat');
const references = require('../deployments/references.json');

async function main() {
  const deployment = await deployments.get('StakeableVestingFactory');
  const artifact = await deployments.getArtifact('StakeableVestingFactory');
  const encodedConstructorArguments = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address'],
    [references.Api3Token, references.Api3Pool]
  );
  const generatedBytecode = ethers.utils.solidityPack(
    ['bytes', 'bytes'],
    [artifact.bytecode, encodedConstructorArguments]
  );
  const salt = ethers.constants.HashZero;
  const deterministicDeploymentAddress = ethers.utils.getCreate2Address(
    '0x4e59b44847b379578588920ca78fbf26c0b4956c', // default create2 factory address in hardhat
    salt,
    ethers.utils.keccak256(generatedBytecode)
  );
  if (deterministicDeploymentAddress !== deployment.address) {
    throw new Error('Deployment not verified');
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
