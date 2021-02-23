//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.3;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/GSN/Context.sol";

import "./interfaces/IGLY.sol";

contract Staking is Context {
    using SafeMath for uint256;

    struct StakingInfo {
        uint256 amount;
        uint256 lastUpdateTime;
        uint256 rewardRate;
    }

    IGLY stakingToken;

    uint256[] rewardRates = [75, 75, 75, 50, 50, 50, 35, 35, 35, 20, 20, 20, 7];
    uint256 public stakingStart;

    uint256 _totalStakes;
    mapping(address => StakingInfo[]) internal stakes;

    constructor(IGLY _stakingToken, uint256 _stakingStart) {
        stakingToken = _stakingToken;
        stakingStart = _stakingStart;
    }

    event Staked(address staker, uint256 amount);
    event Unstaked(address staker, uint256 amount);
    event ClaimedReward(address staker, uint256 amount);

    function getStakingStart() public view returns (uint256) {
        return stakingStart;
    }

    function totalStakes() public view returns (uint256) {
        return _totalStakes;
    }

    function isStakeHolder(address _address) public view returns (bool) {
        return stakes[_address].length > 0;
    }

    function totalStakeOf(address _stakeHolder) public view returns (uint256) {
        uint256 _total = 0;
        for (uint256 j = 0; j < stakes[_stakeHolder].length; j += 1) {
            uint256 amount = stakes[_stakeHolder][j].amount;
            _total = _total.add(amount);
        }

        return _total;
    }

    function getRewardRate(uint256 _updateTime)
        public
        view
        returns (uint256 _rewardRate)
    {
        _rewardRate = _updateTime.sub(stakingStart).div(30 days);
        if (_rewardRate > 13) _rewardRate = 12;
    }

    function stake(uint256 _amount) public {
        require(stakingStart <= block.timestamp, "Staking is not started");
        require(
            stakingToken.transferFrom(_msgSender(), address(this), _amount),
            "Stake required!"
        );

        uint256 lastUpdateTime = block.timestamp;

        stakes[_msgSender()].push(
            StakingInfo(_amount, lastUpdateTime, getRewardRate(lastUpdateTime))
        );
        _totalStakes = _totalStakes.add(_amount);
        emit Staked(_msgSender(), _amount);
    }

    function unstake() public {
        uint256 withdrawAmount = 0;
        uint256 _staked = totalStakeOf(_msgSender());
        uint256 _reward = rewardOf(_msgSender());

        stakingToken.transfer(_msgSender(), _staked);
        stakingToken.mint(_msgSender(), _reward);
        _totalStakes = _totalStakes.sub(_staked);
        delete stakes[_msgSender()];
        emit Unstaked(_msgSender(), withdrawAmount);
    }

    function calculateReward(
        uint256 _lastUpdateTime,
        uint256 _rewardRate,
        uint256 _amount
    ) internal view returns (uint256) {
        uint256 rewardAmount;
        uint256 currentTime = block.timestamp;
        uint256 updateTime = _lastUpdateTime;
        uint256 rate = _rewardRate;

        uint256 mod =
            updateTime.sub(stakingStart).mod(30 days).div(1 days).mul(1 days);

        if (updateTime + 30 days - mod <= currentTime) {
            rewardAmount = rewardAmount.add(
                _amount
                    .mul(rewardRates[rate])
                    .mul(30 days - mod)
                    .div(365 days)
                    .div(100)
            );

            updateTime = updateTime + 30 days - mod;
            if (rate < 12) rate = rate.add(1);
        }

        while (updateTime + 30 days <= currentTime) {
            rewardAmount = rewardAmount.add(
                _amount.mul(rewardRates[rate]).mul(30 days).div(365 days).div(
                    100
                )
            );
            updateTime = updateTime + 30 days;
            if (rate < 12) rate = rate.add(1);
        }

        return rewardAmount;
    }

    /**
     * @notice A method to allow a stakeholder to check his rewards.
     * @param _stakeholder The stakeholder to check rewards for.
     */
    function rewardOf(address _stakeholder) public view returns (uint256) {
        uint256 rewardAmount = 0;
        for (uint256 j = 0; j < stakes[_stakeholder].length; j += 1) {
            uint256 amount = stakes[_stakeholder][j].amount;
            uint256 rate = stakes[_stakeholder][j].rewardRate;
            uint256 reward =
                calculateReward(
                    stakes[_stakeholder][j].lastUpdateTime,
                    rate,
                    amount
                );
            rewardAmount = rewardAmount.add(reward);
        }
        return rewardAmount;
    }

    /**
     * @notice A method to check if the holder can claim rewards
     */
    function isClaimable() public view returns (bool, uint256) {
        uint256 reward = rewardOf(_msgSender());

        return (reward > 0, 0);
    }

    /**
     * @notice A method to allow a stakeholder to withdraw his rewards.
     */
    function claimReward() public {
        address stakeholder = _msgSender();

        uint256 rewardAmount = rewardOf(stakeholder);

        require(rewardAmount > 0, "Reward is empty!");

        stakingToken.mint(_msgSender(), rewardAmount);

        for (uint256 j = 0; j < stakes[stakeholder].length; j += 1) {
            uint256 currentTime = block.timestamp;
            uint256 _lastUpdateTime =
                currentTime -
                    currentTime.sub(stakingStart).mod(30 days).div(1 days).mul(
                        1 days
                    );
            stakes[stakeholder][j].lastUpdateTime = _lastUpdateTime;
            stakes[stakeholder][j].rewardRate = getRewardRate(_lastUpdateTime);
        }

        emit ClaimedReward(_msgSender(), rewardAmount);
    }
}
