const hre = require('hardhat');
const moment = require('moment');

async function main() {
  const GLY = await hre.ethers.getContractFactory('GLY');
  const glyph = await GLY.deploy();

  await glyph.deployed();

  console.log('Glyph deployed to:', glyph.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
