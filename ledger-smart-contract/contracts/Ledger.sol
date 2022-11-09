// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error NotOwnerError();

contract Ledger {
    address public immutable i_owner;
    address[] public users;
    mapping(address => uint256) public s_donatorToDonatedAmounts;
    mapping(string => address) public s_cidToAddress;
    mapping(address => string[]) public s_addressToOwnedCids;

    event NewCidRegistered(address ownerAddress, string cid);
    event DonationsWithdrawal();
    event NewDonation();

    constructor() {
        i_owner = msg.sender;
    }

    function publishCid(string memory cid) public {
        s_cidToAddress[cid] = msg.sender;
        s_addressToOwnedCids[msg.sender].push(cid);
        users.push(msg.sender);
        emit NewCidRegistered(msg.sender, cid);
    }

    function getPublishedCids() public view returns (string[] memory) {
        return s_addressToOwnedCids[msg.sender];
    }

    function getPublishedCidsByUser(address userAddress)
        public
        view
        returns (string[] memory)
    {
        return s_addressToOwnedCids[userAddress];
    }

    function getOwnerOfCid(string memory cid) public view returns (address) {
        return s_cidToAddress[cid];
    }

    function withdraw() public onlyOwner {
        emit DonationsWithdrawal();
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success, "Call failed!");
    }

    // called when no call data is specifiess
    receive() external payable {
        s_donatorToDonatedAmounts[msg.sender] += msg.value;
        emit NewDonation();
    }

    // called when the function from call data is not found
    fallback() external payable {
        if (msg.value > 0) {
            revert("Fallback");
        }
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert NotOwnerError();
        }
        _;
    }
}
