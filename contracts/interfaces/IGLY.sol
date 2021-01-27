//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IGLY is IERC20 {
    function mint(address _to, uint256 _amount) external;
}
