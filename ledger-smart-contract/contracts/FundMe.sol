// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error FundMe__NotOwner();

contract FundMe {
    mapping(address => uint256) private s_addressToAmountFunded;

    constructor() {}
}
