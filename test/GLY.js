// We import Chai to use its asserting functions here.
const { expect } = require('chai');

// `describe` is a Mocha function that allows you to organize your tests. It's
// not actually needed, but having your tests organized makes debugging them
// easier. All Mocha functions are available in the global scope.

// `describe` receives the name of a section of your test suite, and a callback.
// The callback must define the tests of that section. This callback can't be
// an async function.
describe('GLY', function () {
  // Mocha has four functions that let you hook into the the test runner's
  // lifecyle. These are: `before`, `beforeEach`, `after`, `afterEach`.

  // They're very useful to setup the environment for tests, and to clean it
  // up after they run.

  // A common pattern is to declare some variables, and assign them in the
  // `before` and `beforeEach` callbacks.

  let GLY;
  let glyphToken;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  // `beforeEach` will run before each test, re-deploying the contract every
  // time. It receives a callback, which can be async.
  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    GLY = await ethers.getContractFactory('GLY');
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // To deploy our contract, we just have to call Token.deploy() and await
    // for it to be deployed(), which happens onces its transaction has been
    // mined.
    glyphToken = await GLY.deploy();
    await glyphToken.addMinterRole(owner.address);
  });

  // You can nest describe calls to create subsections.
  describe('Deployment', function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    it('Should assign the total supply of tokens to the owner', async function () {
      const ownerBalance = await glyphToken.balanceOf(owner.address);
      expect(await glyphToken.totalSupply()).to.equal(ownerBalance);
    });
  });

  describe('Mint', function () {
    // `it` is another Mocha function. This is the one you use to define your
    // tests. It receives the test name, and a callback function.

    it('Should mint token', async function () {
      const mintAmount = ethers.BigNumber.from(10).pow(18).mul(300);
      await glyphToken.burn(mintAmount);
      await glyphToken.mint(addr1.address, mintAmount);
      expect(await glyphToken.balanceOf(addr1.address)).to.equal(mintAmount);
    });
  });

  describe('Transactions', function () {
    it('Should transfer tokens between accounts', async function () {
      // Transfer 50 tokens from owner to addr1
      await glyphToken.transfer(addr1.address, 50);
      const addr1Balance = await glyphToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(50);

      // Transfer 50 tokens from addr1 to addr2
      // We use .connect(signer) to send a transaction from another account
      await glyphToken.connect(addr1).transfer(addr2.address, 50);
      const addr2Balance = await glyphToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(50);
    });

    it('Should fail if sender doesn’t have enough tokens', async function () {
      const initialOwnerBalance = await glyphToken.balanceOf(owner.address);

      // Try to send 1 token from addr1 (0 tokens) to owner (1000 tokens).
      // `require` will evaluate false and revert the transaction.
      await expect(glyphToken.connect(addr1).transfer(owner.address, 1)).to.be.revertedWith(
        'ERC20: transfer amount exceeds balance',
      );

      // Owner balance shouldn't have changed.
      expect(await glyphToken.balanceOf(owner.address)).to.equal(initialOwnerBalance);
    });

    it('Should update balances after transfers', async function () {
      const initialOwnerBalance = await glyphToken.balanceOf(owner.address);

      // Transfer 100 tokens from owner to addr1.
      await glyphToken.transfer(addr1.address, 100);

      // Transfer another 50 tokens from owner to addr2.
      await glyphToken.transfer(addr2.address, 50);

      // // Check balances.
      const finalOwnerBalance = await glyphToken.balanceOf(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance.sub(150));

      const addr1Balance = await glyphToken.balanceOf(addr1.address);
      expect(addr1Balance).to.equal(ethers.BigNumber.from(100));

      const addr2Balance = await glyphToken.balanceOf(addr2.address);
      expect(addr2Balance).to.equal(ethers.BigNumber.from(50));
    });
  });
});
