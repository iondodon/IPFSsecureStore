// SPDX-License-Identifier: MIT
// 1. Pragma
pragma solidity ^0.8.7;

// 3. Interfaces, Libraries, Contracts
error FundMe__NotOwner();

/**@title A sample Funding Contract
 * @author Patrick Collins
 * @notice This contract is for creating a sample funding contract
 * @dev This implements price feeds as our library
 */
contract FundMe {
    mapping(address => uint256) private s_addressToAmountFunded;

    constructor() {}
}
