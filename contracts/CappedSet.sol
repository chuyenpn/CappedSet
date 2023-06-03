// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract CappedSet {

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
    mapping(uint256 => address) private index2Adrress; // index => address
    mapping(uint256 => uint256) private index2Value; // index => value
    mapping(address => uint256) private address2Value; // address => value // use to get value of address
    mapping(address => uint256) private address2Index; // address => index // use to get index of address (delete)
    address private minAddress;
    uint256 private minValue;
    uint256 private minIndex;

    function insert(address addr, uint256 value) public returns (address newLowestAddress, uint256 newLowestValue) {
        require(isItemInserted[addr] == false, "This address has been inserted. Use function update to update its value");
        isItemInserted[addr] = true;
        
        if (length == 0) {
            index2Adrress[0] = addr;
            index2Value[0] = value;
            address2Value[addr] = value;
            address2Index[addr] = 0;
            minAddress = addr;
            minValue = value;
            minIndex = 0;
            length++;
            emit LowestItem(address(0), 0); //emit for testing
            emit Inserted(addr, value);
            return (address(0), 0);
        }

        if (length < maxLength) {
            if (value < minValue) {
                minAddress = addr;
                minValue = value;
                minIndex = length;
            }
            index2Adrress[length] = addr;
            index2Value[length] = value;
            address2Value[addr] = value;
            address2Index[addr] = length;
            length++;
            emit LowestItem(minAddress, minValue); //emit for testing
            emit Inserted(addr, value);
            return (minAddress, minValue);
        }

        _removeIndex(minIndex);
        index2Adrress[length] = addr;
        index2Value[length] = value;
        address2Value[addr] = value;
        address2Index[addr] = length;
        length++;
        (minAddress, minValue, minIndex) = _findMinAddressAndMinValue();
        emit LowestItem(minAddress, minValue); //emit for testing
        emit Inserted(addr, value);
        return (minAddress, minValue);
    }

    function update(address addr, uint256 newVal) public returns (address newLowestAddress, uint256 newLowestValue) {
      require(isItemInserted[addr] == true, "This address has not been inserted. Use function insert to insert its value first");
      uint256 oldValue = address2Value[addr];
      
      if (addr == minAddress && newVal > minValue) {
        address2Value[addr] = newVal;
        (minAddress, minValue, minIndex) = _findMinAddressAndMinValue();
        emit LowestItem(minAddress, minValue); //emit for testing
        emit Updated(addr, oldValue, newVal);
        return (minAddress, minValue);
      }

      if (newVal < minValue) {
        minAddress = addr;
        minValue = newVal;
        minIndex = address2Index[addr];
      }

      address2Value[addr] = newVal;

      emit LowestItem(minAddress, minValue); //emit for testing
      emit Updated(addr, oldValue, newVal);
      return (minAddress, minValue);
    }

    function remove(address addr) public returns (address newLowestAddress, uint256 newLowestValue) {
      require(isItemInserted[addr] == true, "This address has not been inserted");
      
      uint index = address2Index[addr];
      _removeIndex(index);

      if (addr == minAddress) { // if the address is minimum, then find new min value
        (minAddress, minValue, minIndex) = _findMinAddressAndMinValue();
      }

      emit LowestItem(minAddress, minValue); //emit for testing
      emit Removed(addr);
      return (minAddress, minValue);
    }

    function getValue(address addr) public view returns (uint256) {
      require(isItemInserted[addr] == true, "Not found this address");
      return address2Value[addr];
    }

    function _removeIndex(uint256 index) private {
      address addr = index2Adrress[index];
      // delete addr
      delete address2Value[addr];
      delete address2Index[addr];
      isItemInserted[addr] = false;

      for (uint256 i = index; i < length - 1; i++) { // move elements
        address nextAddress = index2Adrress[i + 1];
        uint256 nextValue = index2Value[i + 1];
        index2Adrress[i] = nextAddress;
        index2Value[i] = nextValue;
        address2Index[nextAddress] = i;
      }

      length--;
    }

    function _findMinAddressAndMinValue() private view returns (address, uint256, uint256) { // return (minAddress, minValue, minIndex)
        if (length == 0) {
          return (address(0), 0, 0);
        }

        if (length == 1) {
          return (index2Adrress[0], index2Value[0], 0);
        }
        
        address tempMinAddress = index2Adrress[0];
        uint256 tempMinValue = index2Value[0];
        uint256 tempMinIndex = 0;

        for (uint256 i = 1; i < length; i++) {
          if (index2Value[i] < tempMinValue) {
            tempMinAddress = index2Adrress[i];
            tempMinValue = index2Value[i];
            tempMinIndex = i;
          }
        }

        return (tempMinAddress, tempMinValue, tempMinIndex);
    }

}
