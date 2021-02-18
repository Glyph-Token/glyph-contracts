const hre = require('hardhat');
const moment = require('moment');

async function main() {
  const glyphAddress = '0x....';
  const startTime = moment().subtract(132, 'days').unix();

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
