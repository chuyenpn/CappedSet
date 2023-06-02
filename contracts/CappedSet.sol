// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

/**
 * @title Storage
 * @dev Store & retrieve value in a variable
 * @custom:dev-run-script ./scripts/deploy_with_ethers.ts
 */
contract CappedSet {

    uint256 public maxLength;

    uint256 length;

    event LowestItem (
        address indexed addr,
        uint256 indexed value
    );

    constructor(uint256 n) {
        maxLength = n;
    }

    mapping(address => bool) isItemInserted;
    mapping(uint256 => address) index2Adrress; // index => address
    mapping(uint256 => uint256) index2Value; // index => value
    mapping(uint256 => uint256) value2Index; // value => index
    mapping(address => uint256) address2Value; // address => value // use to get value of address
    mapping(address => uint256) address2Index; // address => index // use to get index of address


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
            emit LowestItem(address(0), 0); //emit for testing
            return (address(0), 0);
        }

        if (length < maxLength) {
            uint256 maxValue = index2Value[length - 1];
            if (value >= maxValue) { //insert to the top, index = length
                index2Adrress[length] = addr;
                index2Value[length] = value;
                value2Index[value] = length;
                address2Value[addr] = value;
                address2Index[addr] = length;
                length++;
            } else {
                _insert(addr, value);
            }
            emit LowestItem(index2Adrress[0], index2Value[0]); //emit for testing
            return (index2Adrress[0], index2Value[0]);
        }

        // if set reaches limit max length
        _removeIndex(0);
        _insert(addr, value);
        emit LowestItem(index2Adrress[0], index2Value[0]); //emit for testing
        return (index2Adrress[0], index2Value[0]);
    }

    function update(address addr, uint256 newVal) public returns (address newLowestAddress, uint256 newLowestValue) {
      require(isItemInserted[addr] == true, "This address has not been inserted. Use function insert to insert its value first");
      remove(addr);
      insert(addr, newVal);
      emit LowestItem(index2Adrress[0], index2Value[0]); //emit for testing
      return (index2Adrress[0], index2Value[0]);
    }

    function remove(address addr) public returns (address newLowestAddress, uint256 newLowestValue) {
      require(isItemInserted[addr] == true, "This address has not been inserted");

      uint index = address2Index[addr];
      _removeIndex(index);

      if (length > 0) {
        emit LowestItem(index2Adrress[0], index2Value[0]); //emit for testing
        return (index2Adrress[0], index2Value[0]);
      }

      emit LowestItem(address(0), 0); //emit for testing
      return (address(0), 0);
    }

    function getValue(address addr) public view returns (uint256) {
      require(isItemInserted[addr] == true, "Not found this address");
      return address2Value[addr];
    }

    function _insert(address addr, uint256 value) private {
      uint256 index = 0;
      if (value2Index[value] > 0 || value == index2Value[0]) { // if value exist => index
        index = value2Index[value];
      } else { // if not, search suitable index by binarySearch
        index = _binarySearch(value);
      }

      for (uint256 i = length; i > index; i--) { // move elements
        address prevAddress = index2Adrress[i - 1];
        uint256 prevValue = index2Value[i - 1];
        index2Adrress[i] = prevAddress;
        index2Value[i] = prevValue;
        value2Index[prevValue] = i;
        address2Index[prevAddress] = i;
      }

      index2Adrress[index] = addr;
      index2Value[index] = value;
      value2Index[value] = index;
      address2Index[addr] = index;
      address2Value[addr] = value;
      length++;
    }

    function _removeIndex(uint256 index) private {
      uint256 oldValue = index2Value[index];
      delete value2Index[oldValue];

      address oldAddress = index2Adrress[index];
      isItemInserted[oldAddress] = false;
      delete address2Value[oldAddress];
      delete address2Index[oldAddress];

      for (uint256 i = index; i < length - 1; i++) { // move elements
        address nextAddress = index2Adrress[i + 1];
        uint256 nextValue = index2Value[i + 1];
        index2Adrress[i] = nextAddress;
        index2Value[i] = nextValue;
        value2Index[nextValue] = i;
        address2Index[nextAddress] = i;
      }
      length--;
    }

    function _binarySearch(uint256 element) private returns (uint256) { 
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
