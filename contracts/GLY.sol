//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.7.3;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/GSN/Context.sol";

contract GLY is ERC20Burnable, AccessControl {
    uint256 public INITIAL_SUPPLY = 1000000000 * 10**18;
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor() ERC20("Glyph", "GLY") {
        _mint(_msgSender(), INITIAL_SUPPLY);
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    /**
     * @dev grants minter role
     * @param _address The address to grant minter role
     */
    function addMinterRole(address _address) external {
        grantRole(MINTER_ROLE, _address);
    }

    /**
     * @dev removes minter role
     * @param _address The address to grant minter role
     */
    function removeMinterRole(address _address) external {
        revokeRole(MINTER_ROLE, _address);
    }

    /**
     * @dev mint GLY
     * @param _to The address that will receive the minted tokens
     * @param _amount The amount of tokens to mint
     */
    function mint(address _to, uint256 _amount) external {
        require(hasRole(MINTER_ROLE, _msgSender()), "Caller is not a minter");
        _mint(_to, _amount);
    }
}
