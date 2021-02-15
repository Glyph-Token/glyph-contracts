// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');
const moment = require('moment');

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const GLY = await hre.ethers.getContractFactory('GLY');
  const glyph = await GLY.deploy();

  await glyph.deployed();

  console.log('Glyph deployed to:', glyph.address);

  const startTime = moment().subtract(132, 'days').unix();
  const Staking = await hre.ethers.getContractFactory('Staking');
  staking = await Staking.deploy(glyph.address, startTime);

  await staking.deployed();
  console.log('Staking deployed to:', staking.address);

  await glyph.addMinterRole(staking.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
