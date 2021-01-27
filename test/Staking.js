// We import Chai to use its asserting functions here.
const { expect } = require('chai');

describe('Staking', async function () {
  let glyToken;
  let stakingContract;
  let owner;
  let user;
  const _divine = ethers.BigNumber.from(10).pow(18);

  beforeEach(async function () {
    const GLY = await ethers.getContractFactory('GLY');
    const Staking = await ethers.getContractFactory('Staking');
    [owner, user] = await ethers.getSigners();

    glyToken = await GLY.deploy();

    stakingContract = await Staking.deploy(glyToken.address);

    await glyToken.addMinterRole(stakingContract.address);
  });

  it('Should able to stake', async function () {
    await glyToken.transfer(user.address, _divine.mul(3));
    await glyToken.connect(user).approve(stakingContract.address, _divine.mul(3));
    await stakingContract.connect(user).stake(_divine.mul(1));

    expect(await glyToken.balanceOf(user.address)).to.equal(_divine.mul(2));
    expect(await glyToken.balanceOf(stakingContract.address)).to.equal(_divine.mul(1));
    expect(await stakingContract.isStakeHolder(user.address)).to.equal(true);
    expect(await stakingContract.totalStakes()).to.equal(_divine.mul(1));
  });

  it('Should able to claim reward', async function () {
    await glyToken.transfer(user.address, _divine.mul(3));

    await glyToken.connect(user).approve(stakingContract.address, _divine.mul(3));
    await stakingContract.connect(user).stake(_divine.mul(1));

    expect((await stakingContract.connect(user).isClaimable())[0]).to.equal(true);
    expect(await stakingContract.rewardOf(user.address)).to.equal(
      _divine.mul(3).mul(75).div(100).div(12).add(_divine.mul(1).mul(50).div(100).div(12)),
    );
    await stakingContract.connect(user).claimReward();
    expect((await stakingContract.connect(user).isClaimable())[0]).to.equal(false);
    expect(await stakingContract.rewardOf(user.address)).to.equal(0);

    expect(await glyToken.balanceOf(user.address)).to.equal(
      _divine.mul(2).add(_divine.mul(3).mul(75).div(100).div(12).add(_divine.mul(1).mul(50).div(100).div(12))),
    );
    expect(await glyToken.balanceOf(stakingContract.address)).to.equal(_divine.mul(1));
  });

  it('Should able to unstake and get remaining reward', async function () {
    await glyToken.transfer(user.address, _divine.mul(3));

    await glyToken.connect(user).approve(stakingContract.address, _divine.mul(3));
    await stakingContract.connect(user).stake(_divine.mul(1));

    expect(await stakingContract.rewardOf(user.address)).to.equal(
      _divine.mul(3).mul(75).div(100).div(12).add(_divine.mul(1).mul(50).div(100).div(12)),
    );
    await stakingContract.connect(user).unstake();

    expect(await glyToken.balanceOf(user.address)).to.equal(
      _divine.mul(3).add(_divine.mul(3).mul(75).div(100).div(12).add(_divine.mul(1).mul(50).div(100).div(12))),
    );
    expect(await glyToken.balanceOf(stakingContract.address)).to.equal(0);

    expect(await stakingContract.isStakeHolder(user.address)).to.equal(false);
    expect(await stakingContract.totalStakes()).to.equal(_divine.mul(0));
  });
});
