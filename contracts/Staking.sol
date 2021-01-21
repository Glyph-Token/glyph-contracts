/**
 *Submitted for verification at Etherscan.io on 2021-01-09
 */

//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Staking is Ownable {
    using SafeMath for uint256;

    struct StakingInfo {
        uint256 amount;
        uint256 depositDate;
    }
    //allowed token addresses
    mapping(address => bool) public allowedTokens;

    IERC20 stakingToken;
    uint256 REWARD_DIVIDER = 10**18;

    uint256 ownerTokensAmount;
    address[] internal stakeholders;
    mapping(address => StakingInfo[]) internal stakes;

    constructor(IERC20 _stakingToken) {
        stakingToken = _stakingToken;
    }

    event Staked(address staker, uint256 amount);
    event Unstaked(address staker, uint256 amount);

    modifier isValidToken(address _tokenAddr) {
        require(allowedTokens[_tokenAddr]);
        _;
    }

    function addToken(address _tokenAddr) external onlyOwner {
        allowedTokens[_tokenAddr] = true;
    }

    function totalStakes() public view returns (uint256) {
        uint256 _totalStakes = 0;
        for (uint256 i = 0; i < stakeholders.length; i += 1) {
            for (uint256 j = 0; j < stakes[stakeholders[i]].length; j += 1)
                _totalStakes = _totalStakes.add(
                    stakes[stakeholders[i]][j].amount
                );
        }
        return _totalStakes;
    }

    function isStakeholder(address _address)
        public
        view
        returns (bool, uint256)
    {
        for (uint256 s = 0; s < stakeholders.length; s += 1) {
            if (_address == stakeholders[s]) return (true, s);
        }
        return (false, 0);
    }

    function addStakeholder(address _stakeholder) public {
        (bool _isStakeholder, ) = isStakeholder(_stakeholder);
        if (!_isStakeholder) stakeholders.push(_stakeholder);
    }

    function removeStakeholder(address _stakeholder) internal {
        (bool _isStakeholder, uint256 s) = isStakeholder(_stakeholder);
        if (_isStakeholder) {
            stakeholders[s] = stakeholders[stakeholders.length - 1];
            stakeholders.pop();
        }
    }

    function stake(uint256 _amount) public {
        uint256 depositFee = (1 * _amount) / 100;
        uint256 leftAmount = _amount - depositFee;

        require(
            stakingToken.transferFrom(msg.sender, address(this), leftAmount),
            "Stake required!"
        );
        if (stakes[msg.sender].length == 0) {
            addStakeholder(msg.sender);
        }
        uint256 depositTime = block.timestamp;
        stakes[msg.sender].push(StakingInfo(leftAmount, depositTime));
        emit Staked(msg.sender, leftAmount);
    }

    function unstake() public {
        uint256 withdrawAmount = 0;
        for (uint256 j = 0; j < stakes[msg.sender].length; j += 1) {
            uint256 amount = stakes[msg.sender][j].amount;
            withdrawAmount = withdrawAmount.add(amount);
            uint256 unstakeTime = block.timestamp;
            uint256 rewardAmount =
                calculateReward(
                    stakes[msg.sender][j].depositDate,
                    unstakeTime,
                    amount
                );
            rewardAmount = rewardAmount.div(REWARD_DIVIDER);
            withdrawAmount = withdrawAmount.add(rewardAmount.div(100));
        }

        require(
            stakingToken.transfer(msg.sender, withdrawAmount),
            "Not enough tokens in contract!"
        );
        delete stakes[msg.sender];
        removeStakeholder(msg.sender);
        emit Unstaked(msg.sender, withdrawAmount);
    }

    function calculateReward(
        uint256 _depositdate,
        uint256 _unstakeTime,
        uint256 _amount
    ) internal pure returns (uint256) {
        uint256 _rewardAmount;
        if (
            _unstakeTime >= _depositdate &&
            _unstakeTime < _depositdate + 90 days
        ) {
            _rewardAmount = (_amount * 75) / 100;
        }
        if (
            _unstakeTime >= _depositdate + 90 days &&
            _unstakeTime < _depositdate + 270 days
        ) {
            _rewardAmount = (_amount * 50) / 100;
        }
        if (
            _unstakeTime >= _depositdate + 270 days &&
            _unstakeTime < _depositdate + 450 days
        ) {
            _rewardAmount = (_amount * 35) / 100;
        }
        if (
            _unstakeTime >= _depositdate + 450 days &&
            _unstakeTime <= _depositdate + 630 days
        ) {
            _rewardAmount = (_amount * 20) / 100;
        }
        if (_unstakeTime > _depositdate + 270 days) {
            _rewardAmount = (_amount * 7) / 100;
        }

        return _rewardAmount;
    }

    function sendTokens(uint256 _amount) public onlyOwner {
        require(
            stakingToken.transferFrom(msg.sender, address(this), _amount),
            "Transfering not approved!"
        );
        ownerTokensAmount = ownerTokensAmount.add(_amount);
    }

    function withdrawTokens(address receiver, uint256 _amount)
        public
        onlyOwner
    {
        uint256 withdrawFee = (1 * _amount) / 100;
        uint256 leftWithdrawAmount = _amount - withdrawFee;

        ownerTokensAmount = ownerTokensAmount.sub(leftWithdrawAmount);
        require(
            stakingToken.transfer(receiver, leftWithdrawAmount),
            "Not enough tokens on contract!"
        );
    }
}
