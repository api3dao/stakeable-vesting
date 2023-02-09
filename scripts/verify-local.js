const { deployments, ethers } = require('hardhat');

async function main() {
  const deployment = await deployments.get('StakeableVestingFactory');
  const artifact = await deployments.getArtifact('StakeableVestingFactory');
  const encodedConstructorArguments = ethers.utils.defaultAbiCoder.encode(
    ['address', 'address'],
    ['0x0b38210ea11411557c13457D4dA7dC6ea731B88a', '0x6dd655f10d4b9E242aE186D9050B68F725c76d76']
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
