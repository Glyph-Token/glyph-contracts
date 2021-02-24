const hre = require('hardhat');
const moment = require('moment');

async function main() {
  const glyphAddress = '0x299948bc2CA54a5e814B19849327A6d9a0e7de1b';
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
