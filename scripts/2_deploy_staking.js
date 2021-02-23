const hre = require('hardhat');
const moment = require('moment');

async function main() {
  const glyphAddress = '0x2EbD9D1A522C766E982Fddb3D9aED1300fC694d9';
  const startTime = moment().add(1, 'hours').unix();

  const Staking = await hre.ethers.getContractFactory('Staking');
  staking = await Staking.deploy(glyphAddress, startTime);
  await staking.deployed();
  console.log('Staking deployed to:', staking.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
