// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "./BokkyPooBahsRedBlackTreeLibrary.sol";

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract CappedSet {

    using BokkyPooBahsRedBlackTreeLibrary for BokkyPooBahsRedBlackTreeLibrary.Tree;

    BokkyPooBahsRedBlackTreeLibrary.Tree tree;

    uint private constant EMPTY = 0;
    uint256 public maxLength;
    uint256 private length;

    event LowestItem (
        address indexed addr,
        uint256 indexed value
    );

    event Inserted (
      address indexed addr,
      uint256 indexed value
    );

    event Updated (
      address indexed addr,
      uint256 oldValue,
      uint256 newValue
    );

    event Removed (
      address indexed addr
    );

    constructor(uint256 n) {
      require(n > 0, "max length of set must greater than 0");
      maxLength = n;
    }

    mapping(address => bool) private isItemInserted;
    mapping(address => uint256) private address2Value; // use to get value in fastest way
    mapping(uint256 => address[]) private value2AddressArr;
    mapping(address => uint256) private address2IndexInArr; // use to delete an address not have to loop array
    address private minAddress;
    uint256 private minValue;

    function insert(address addr, uint256 value) public returns (address newLowestAddress, uint256 newLowestValue) {
        require(value != EMPTY, "Value to insert cannot be zero");
        require(isItemInserted[addr] == false, "This address has been inserted. Use function update to update its value");
        
        if (length == 0) {
            if (value2AddressArr[value].length == 0) {
              tree.insert(value);
            }
            value2AddressArr[value].push(addr);
            _insertAddress(addr, value, value2AddressArr[value].length - 1);
            minAddress = addr;
            minValue = value;
            emit LowestItem(address(0), 0); //emit for testing
            emit Inserted(addr, value);
            return (address(0), 0);
        }

        if (length < maxLength) {
            if (value2AddressArr[value].length == 0) {
              tree.insert(value);
            }
            value2AddressArr[value].push(addr);
            _insertAddress(addr, value, value2AddressArr[value].length - 1);

            if (value < minValue) {
              minValue = value;
              minAddress = addr;
            }

            emit LowestItem(minAddress, minValue); //emit for testing
            emit Inserted(addr, value);
            return (minAddress, minValue);
        }

        uint256 minAddressLength = value2AddressArr[minValue].length;
        if (minAddressLength > 1) { //if multiple min addresses, then delete first address
          address addrDelete = value2AddressArr[minValue][0];
          _deleteAddress(addrDelete);
          value2AddressArr[minValue][0] = value2AddressArr[minValue][minAddressLength - 1];
          value2AddressArr[minValue].pop();
          minAddress = value2AddressArr[value][0];

          // then insert address, value
          if (value2AddressArr[value].length == 0) {
            tree.insert(value);
          }
          value2AddressArr[value].push(addr);
          _insertAddress(addr, value, value2AddressArr[value].length - 1);

          if (value < minValue) {
            minValue = value;
            minAddress = addr;
          }
        } else { // delete tree, then find new min value
          tree.remove(minValue);
          address addrDelete = value2AddressArr[minValue][0];
          _deleteAddress(addrDelete);
          delete value2AddressArr[minValue];

          if (value2AddressArr[value].length == 0) {
            tree.insert(value);
          }
          value2AddressArr[value].push(addr);
          _insertAddress(addr, value, value2AddressArr[value].length - 1);

          minValue = tree.first();
          minAddress = value2AddressArr[minValue][0];
        }

        emit LowestItem(minAddress, minValue); //emit for testing
        emit Inserted(addr, value);
        return (minAddress, minValue);
    }

    function update(address addr, uint256 newVal) public returns (address newLowestAddress, uint256 newLowestValue) {
      require(newVal != EMPTY, "Value to update cannot be zero");
      require(isItemInserted[addr] == true, "This address has not been inserted. Use function insert to insert its value first");
      uint256 oldValue = address2Value[addr];
      remove(addr);
      insert(addr, newVal);

      emit LowestItem(minAddress, minValue); //emit for testing
      emit Updated(addr, oldValue, newVal);
      return (minAddress, minValue);
    }

    function remove(address addr) public returns (address newLowestAddress, uint256 newLowestValue) {
      require(isItemInserted[addr] == true, "This address has not been inserted");

      uint256 valueOfAddr = address2Value[addr];
      if (value2AddressArr[valueOfAddr].length == 1) {
        delete value2AddressArr[valueOfAddr];
        _deleteAddress(addr);

        if (valueOfAddr == minValue) { // find new minValue
          tree.remove(valueOfAddr);
          minValue = tree.first();
          minAddress = value2AddressArr[minValue][0];
        }
      } else {
        uint256 index = address2IndexInArr[addr];
        uint256 arrLength = value2AddressArr[valueOfAddr].length;
        value2AddressArr[valueOfAddr][index] = value2AddressArr[valueOfAddr][arrLength - 1]; //swap with last element
        value2AddressArr[valueOfAddr].pop();
        _deleteAddress(addr);

        if (minAddress == addr) {
          minAddress = value2AddressArr[valueOfAddr][0];
        }
      }

      emit LowestItem(minAddress, minValue); //emit for testing
      emit Removed(addr);
      return (minAddress, minValue);
    }

    function getValue(address addr) public view returns (uint256) {
      require(isItemInserted[addr] == true, "Not found this address");
      return address2Value[addr];
    }

    function _insertAddress(address addr, uint256 value, uint256 indexInArr) private {
      isItemInserted[addr] = true;
      address2Value[addr] = value;
      address2IndexInArr[addr] = indexInArr;
      length++;
    }

    function _deleteAddress(address addr) private {
      isItemInserted[addr] = false;
      delete address2Value[addr];
      delete address2IndexInArr[addr];
      length--;
    }

}
