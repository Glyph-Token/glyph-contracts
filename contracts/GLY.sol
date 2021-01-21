/**
 *Submitted for verification at Etherscan.io on 2021-01-09
 */

//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GLY is ERC20, Ownable {
    uint256 public INITIAL_SUPPLY = 1000000000 * 10**18;

    constructor() ERC20("Glyph", "GLY") {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
}
