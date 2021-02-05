// We import Chai to use its asserting functions here.
const { expect } = require('chai');
const moment = require('moment');

describe('Staking', async function () {
  let glyToken;
  let stakingContract;
  let owner;
  let user;
  let startTime;

  beforeEach(async function () {
    const GLY = await ethers.getContractFactory('GLY');
    const Staking = await ethers.getContractFactory('Staking');
    [owner, user] = await ethers.getSigners();

    glyToken = await GLY.deploy();
    await glyToken.deployed();

    startTime = moment().subtract(132, 'days').unix();
    stakingContract = await Staking.deploy(glyToken.address, startTime);

    await stakingContract.deployed();
    await glyToken.addMinterRole(stakingContract.address);

    await glyToken.transfer(user.address, ethers.utils.parseEther('3.0'));
    await glyToken.burn(ethers.utils.parseEther('1000000000').sub(ethers.utils.parseEther('3.0')));
    await glyToken.connect(user).approve(stakingContract.address, ethers.utils.parseEther('3.0'));
    await stakingContract.connect(user).stake(ethers.utils.parseEther('1.0'));
  });

  it('Should able to stake', async function () {
    expect(await glyToken.balanceOf(user.address)).to.equal(ethers.utils.parseEther('2.0'));
    expect(await glyToken.balanceOf(stakingContract.address)).to.equal(ethers.utils.parseEther('1.0'));
    expect(await stakingContract.isStakeHolder(user.address)).to.equal(true);
    expect(await stakingContract.totalStakes()).to.equal(ethers.utils.parseEther('1.0'));
  });

  it('Should able to claim reward', async function () {
    expect((await stakingContract.connect(user).isClaimable())[0]).to.equal(true);

    expect(await stakingContract.rewardOf(user.address)).to.equal(
      ethers.utils.parseEther('1.0').mul(50).mul(12).div(365).div(100),
    );
    await stakingContract.connect(user).claimReward();
    expect((await stakingContract.connect(user).isClaimable())[0]).to.equal(false);
    expect(await stakingContract.rewardOf(user.address)).to.equal(0);

    expect(await glyToken.balanceOf(user.address)).to.equal(
      ethers.utils.parseEther('2.0').add(ethers.utils.parseEther('1.0').mul(50).mul(12).div(365).div(100)),
    );
    expect(await glyToken.balanceOf(stakingContract.address)).to.equal(ethers.utils.parseEther('1.0'));
  });

  it('Should able to unstake and get remaining reward', async function () {
    await stakingContract.connect(user).unstake();

    expect(await glyToken.balanceOf(user.address)).to.equal(
      ethers.utils.parseEther('3.0').add(ethers.utils.parseEther('1.0').mul(50).mul(12).div(365).div(100)),
    );
    expect(await glyToken.balanceOf(stakingContract.address)).to.equal(0);

    expect(await stakingContract.isStakeHolder(user.address)).to.equal(false);
    expect(await stakingContract.totalStakes()).to.equal(0);
  });
});
