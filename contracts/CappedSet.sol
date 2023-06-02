// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract CappedSet {

    uint256 public maxLength;

    uint256 public length;

    constructor(uint256 n) {
        maxLength = n;
    }

    mapping(address => bool) public isItemInserted;
    mapping(uint256 => address) public index2Adrress; // index => address
    mapping(uint256 => uint256) public index2Value; // index => value
    mapping(uint256 => uint256) public value2Index; // value => index
    mapping(address => uint256) public address2Value; // address => value // use to get value of address
    mapping(address => uint256) public address2Index; // address => index // use to get index of address


    function insert(address addr, uint256 value) public returns (address newLowestAddress, uint256 newLowestValue) {
        require(isItemInserted[addr] == false, "This address has been inserted. Use function update to update its value");
        isItemInserted[addr] = true;
        
        if (length == 0) {
            index2Adrress[0] = addr;
            index2Value[0] = value;
            value2Index[value] = 0;
            address2Index[addr] = 0;
            address2Value[addr] = value;
            length++;
            return (address(0), 0);
        }

        if (length < maxLength) {
            uint256 maxValue = index2Value[length - 1];
            if (value >= maxValue) { //insert to the top, index = length
                index2Adrress[length] = addr;
                index2Value[length] = value;
                value2Index[value] = length;
                address2Index[addr] = length;
                length++;
            } else {
                _insert(addr, value);
            }
            return (index2Adrress[0], index2Value[0]);
        }

        // if limit max length
        _removeIndex(0);
        _insert(addr, value);

        return (index2Adrress[0], index2Value[0]);
    }

    function update(address addr, uint256 newVal) public returns (address newLowestAddress, uint256 newLowestValue) {
      require(isItemInserted[addr] == true, "This address has not been inserted. Use function insert to insert its value first");
      remove(addr);
      return insert(addr, newVal);
    }

    function remove(address addr) public returns (address newLowestAddress, uint256 newLowestValue) {
      require(isItemInserted[addr] == true, "This address has not been inserted.");

      uint index = address2Index[addr];
      _removeIndex(index);

      isItemInserted[addr] = false;
      delete address2Value[addr];
      delete address2Index[addr];
      if (length > 0) {
        return (index2Adrress[0], index2Value[0]);
      }
      return (address(0), 0);
    }

    function getValue(address addr) public view returns (uint256) {
      require(isItemInserted[addr] == true, "This address has not been inserted.");
      return address2Value[addr];
    }

    function _insert(address addr, uint256 value) private {
      uint256 index = 0;
      if (value2Index[value] > 0 || value == index2Value[0]) { // if value exist => index
        index = value2Index[value];
      } else { // if not, search suitable index by binarySearch
        index = _binarySearch(value);
      }

      for (uint256 i = length - 1; i > index; i--) {
        index2Adrress[i + 1] = index2Adrress[i];
        index2Value[i + 1] = index2Value[i];
      }

      index2Adrress[index] = addr;
      index2Value[index] = value;
      value2Index[value] = index;
      address2Index[addr] = index;
      address2Value[addr] = value;
      length++;
    }

    function _removeIndex(uint256 index) private {
      for (uint256 i = index; i < length - 1; i++) {
        index2Adrress[i] = index2Adrress[i + 1];
        index2Value[i] = index2Value[i + 1];
      }
      length--;
    }

    function _binarySearch(uint256 element) private view returns (uint256) { 
        uint256 low = 0;
        uint256 high = length - 1;
        while (low < high) {
            uint256 mid = (low + high) / 2;
            if (index2Value[mid] < element) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return low;
    }

}
