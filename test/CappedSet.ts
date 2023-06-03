import { expect } from "chai";
import { ethers } from "hardhat";
import type {
  ContractTransaction,
  ContractReceipt,
  Event,
  BigNumber
} from "ethers";
import { Result } from "@ethersproject/abi";

import { randomInt, randomAddress } from "./helper";
import * as Contracts from "../typechain-types";

const EVENT_CATCH_LOWEST_ITEM = 'LowestItem';
const MAX_LENGTH = 10;
const MAX_VALUE = 10_000;
interface CappedSetDeploy {
  cappedSet: Contracts.CappedSet
}

describe("CappedSet", function () {
  async function deploy(): Promise<CappedSetDeploy> {
    const n: number = MAX_LENGTH;
    const CappedSetDeploy: Contracts.CappedSet__factory = await ethers.getContractFactory("CappedSet");
    const cappedSet: Contracts.CappedSet = await CappedSetDeploy.deploy(n);
    return { cappedSet };
  }

  describe("Insert", function () {
    it("Insert first element with random value: Should return address(0) and value(0)", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const address: string = randomAddress();
      const value: number = randomInt(1, MAX_VALUE);
      const txResponse: ContractTransaction  = await deployed.cappedSet.insert(address, value);
      const txReceipt: ContractReceipt = await txResponse.wait();
      const transferEvent: Event[] | undefined = txReceipt.events;

      if (transferEvent != undefined && transferEvent.length > 0) {
        const result: Result | undefined = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        expect(result?.addr).to.equal(ethers.constants.AddressZero);
        expect(result?.value).to.equal(0);
      }
    });

    it("Insert 2nd element with same address: Should revert with message: \"This address has been inserted. Use function update to update its value\"", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const address: string = randomAddress();
      const value: number = randomInt(1, MAX_VALUE);
      const txResponse: ContractTransaction = await deployed.cappedSet.insert(address, value);
      await txResponse.wait();

      const value2: number = value + randomInt(1, MAX_VALUE);
      await expect(deployed.cappedSet.insert(address, value2)).to.be.revertedWith("This address has been inserted. Use function update to update its value");
    });

    it("Insert 3rd element: Should return lowest address and lowest value", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const addressArr: string[] = [];
      const valueArr: number[] = [];
      const length = randomInt(3, MAX_LENGTH);
      for (let i: number = 0; i < length; i++) {
        addressArr[i] = randomAddress();
        valueArr[i] = randomInt(1, MAX_VALUE);
      }

      let minValue: number = Number.MAX_SAFE_INTEGER;
      for (let i: number = 0; i < valueArr.length; i++) {
        if (valueArr[i] < minValue) {
          minValue = valueArr[i];
        }
      }

      // find multiple min addresses
      const minAddressArr: string[] = [];
      for (let i = 0; i < valueArr.length; i++) {
        if (valueArr[i] == minValue) {
          minAddressArr.push(addressArr[i]);
        }
      }

      let result: Result | undefined;
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i], valueArr[i]);
        const txReceipt: ContractReceipt = await txResponse.wait();
        const transferEvent: Event[] | undefined = txReceipt.events;
        if (transferEvent != undefined && transferEvent.length > 0) {
          result = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        }
      }
      
      expect(minAddressArr).to.contains(result?.addr);
      expect(result?.value).to.equal(minValue);
    });

    it("Insert until capped (n = 10): Should boot out the element with the lowest value", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const addressArr: string[] = [];
      const valueArr: number[] = [];

      for (let i: number = 0; i < MAX_LENGTH; i++) {
        addressArr[i] = randomAddress();
        valueArr[i] = randomInt(1, MAX_VALUE);
      }
      
      let result: Result | undefined;
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i], valueArr[i]);
        const txReceipt: ContractReceipt = await txResponse.wait();
        const transferEvent: Event[] | undefined = txReceipt.events;
        if (transferEvent != undefined && transferEvent.length > 0) {
          result = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        }
      }

      let minAddress: string = result?.addr;

      const newAddr = randomAddress();
      const newValue = randomInt(1, MAX_LENGTH);
      const txResponse1: ContractTransaction = await deployed.cappedSet.insert(newAddr, newValue);
      const txReceipt1: ContractReceipt = await txResponse1.wait();
      const transferEvent1: Event[] | undefined = txReceipt1.events;
      if (transferEvent1 != undefined && transferEvent1.length > 0) {
        const result: Result | undefined = transferEvent1.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        expect(result?.addr).to.not.equal(minAddress);
      }
    });
  });

  describe("Update", function () {
    it("Update not existing address: Should revert with message: \"This address has not been inserted. Use function insert to insert its value first\"", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const address1: string = randomAddress();
      let address2: string = address1;
      while (address2 == address1) {
        address2 = randomAddress();
      }

      const value1: number = randomInt(1, MAX_VALUE);
      const value2: number = value1 + randomInt(1, MAX_VALUE);
      await deployed.cappedSet.insert(address1, value1);
      await expect(deployed.cappedSet.update(address2, value2)).to.be.revertedWith("This address has not been inserted. Use function insert to insert its value first");
    });

    it("Update element with existing address: Should update the address with new value", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const addressArr: string[] = [];
      const valueArr: number[] = [];
      const length = randomInt(3, MAX_LENGTH);
      for (let i: number = 0; i < length; i++) {
        addressArr[i] = randomAddress();
        valueArr[i] = randomInt(1, MAX_VALUE);
      }
      
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i], valueArr[i]);
        await txResponse.wait();
      }

      //update
      let indexUpdate = randomInt(0, length - 1);
      let addressUpdate = addressArr[indexUpdate];
      let valueUpdate = valueArr[indexUpdate] + randomInt(1, MAX_LENGTH);
      const txResponse: ContractTransaction = await deployed.cappedSet.update(addressUpdate, valueUpdate);
      await txResponse.wait();
      const value: BigNumber = await deployed.cappedSet.getValue(addressUpdate);
      expect(value).to.equal(valueUpdate);
    });

    it("Update element with existing address which is not minimum element: Update Should return lowest address and lowest value after update", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const addressArr: string[] = [];
      const valueArr: number[] = [];
      const length = randomInt(3, MAX_LENGTH);
      for (let i: number = 0; i < length; i++) {
        addressArr[i] = randomAddress();
        valueArr[i] = randomInt(1, MAX_VALUE);
      }

      let minValue: number = Number.MAX_SAFE_INTEGER;
      let maxValue: number = Number.MIN_SAFE_INTEGER;
      let maxIndex: number = 0;
      for (let i: number = 0; i < valueArr.length; i++) {
        if (valueArr[i] < minValue) {
          minValue = valueArr[i];
        }

        if (valueArr[i] > maxValue) {
          maxValue = valueArr[i];
          maxIndex = i;
        }
      }

      const minAddressArr: string[] = [];
      for (let i = 0; i < valueArr.length; i++) {
        if (valueArr[i] == minValue) {
          minAddressArr.push(addressArr[i]);
        }
      }
      
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i], valueArr[i]);
        await txResponse.wait();
      }

      const indexUpdate = maxIndex;
      const valueUpdate = maxValue + randomInt(1, MAX_VALUE);
      const addressUpdate = addressArr[indexUpdate];
      const txResponse: ContractTransaction = await deployed.cappedSet.update(addressUpdate, valueUpdate);
      const txReceipt: ContractReceipt = await txResponse.wait();
      const transferEvent: Event[] | undefined = txReceipt.events;
      if (transferEvent != undefined && transferEvent.length > 0) {
        const result: Result | undefined = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        // console.log('result === ', result)
        expect(minAddressArr).to.contains(result?.addr);
        expect(result?.value).to.equal(minValue);
      }
      
    });

    it("Update element with existing address which is minimum element: Update Should return lowest address and lowest value after update", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const addressArr: string[] = [];
      const valueArr: number[] = [];
      const length = randomInt(3, MAX_LENGTH);
      for (let i: number = 0; i < length; i++) {
        addressArr[i] = randomAddress();
        valueArr[i] = randomInt(1, MAX_VALUE);
      }
     
      let result: Result | undefined;
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i], valueArr[i]);
        const txReceipt: ContractReceipt = await txResponse.wait();
        const transferEvent: Event[] | undefined = txReceipt.events;
        if (transferEvent != undefined && transferEvent.length > 0) {
          result = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        }
      }

      const lastMinAddress: string = result?.addr;
      const lastMinValue: number = parseInt(result?.value);
      const valueUpdate: number = lastMinValue + randomInt(1, MAX_VALUE);
      const txResponse: ContractTransaction = await deployed.cappedSet.update(lastMinAddress, valueUpdate);
      const txReceipt: ContractReceipt = await txResponse.wait();
      const transferEvent: Event[] | undefined = txReceipt.events;
      if (transferEvent != undefined && transferEvent.length > 0) {
        const result: Result | undefined = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;

        // update addressArr and valueArr
        for (let i: number = 0; i < length; i++) {
          if (addressArr[i] == lastMinAddress) {
            valueArr[i] = valueUpdate;
          }
        }

        // find new min address and value
        let minValue: number = Number.MAX_SAFE_INTEGER;
        for (let i: number = 0; i < valueArr.length; i++) {
          if (valueArr[i] < minValue) {
            minValue = valueArr[i];
          }
        }

        // find multiple min addresses
        const minAddressArr: string[] = [];
        for (let i = 0; i < valueArr.length; i++) {
          if (valueArr[i] == minValue) {
            minAddressArr.push(addressArr[i]);
          }
        }

        expect(minAddressArr).to.contains(result?.addr);
        expect(result?.value).to.equal(minValue);
      }
      
    });
  });

  describe("Delete", function () {
    it("Delete not existing address: Should revert with message: \"This address has not been inserted\"", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const address1: string = randomAddress();
      let address2: string = address1;
      while (address2 == address1) {
        address2 = randomAddress();
      }
      const value1: number = randomInt(1, MAX_VALUE);
      const value2: number = value1 + randomInt(1, MAX_VALUE);
      await deployed.cappedSet.insert(address1, value1);
      await expect(deployed.cappedSet.remove(address2)).to.be.revertedWith("This address has not been inserted");
    });

    it("Delete element with existing address: Should delete the address (call getValue function will revert with a message)", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const addressArr: string[] = [];
      const valueArr: number[] = [];
      const length = randomInt(3, MAX_LENGTH);
      for (let i: number = 0; i < length; i++) {
        addressArr[i] = randomAddress();
        valueArr[i] = randomInt(1, MAX_VALUE);
      }
      
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i], valueArr[i]);
        await txResponse.wait();
      }

      //update
      let indexDelete = randomInt(0, length - 1);
      let addressDelete = addressArr[indexDelete];
      const txResponse: ContractTransaction = await deployed.cappedSet.remove(addressDelete);
      await txResponse.wait();
      await expect(deployed.cappedSet.getValue(addressDelete)).to.be.revertedWith("Not found this address");
    });

    it("Delete element with existing address: Should return lowest address and lowest value after delete", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const addressArr: string[] = [];
      const valueArr: number[] = [];
      const length = randomInt(3, MAX_LENGTH);
      for (let i: number = 0; i < length; i++) {
        addressArr[i] = randomAddress();
        valueArr[i] = randomInt(1, MAX_VALUE);
      }

      let minValue: number = Number.MAX_SAFE_INTEGER;
      let maxValue: number = Number.MIN_SAFE_INTEGER;
      let maxIndex: number = 0;
      for (let i: number = 0; i < valueArr.length; i++) {
        if (valueArr[i] < minValue) {
          minValue = valueArr[i];
        }

        if (valueArr[i] > maxValue) {
          maxValue = valueArr[i];
          maxIndex = i;
        }
      }

      const minAddressArr: string[] = [];
      for (let i = 0; i < valueArr.length; i++) {
        if (valueArr[i] == minValue) {
          minAddressArr.push(addressArr[i]);
        }
      }
      
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i], valueArr[i]);
        await txResponse.wait();
      }

      let indexDelete = maxIndex;
      let addressDelete = addressArr[indexDelete];
      const txResponse: ContractTransaction = await deployed.cappedSet.remove(addressDelete);
      const txReceipt: ContractReceipt = await txResponse.wait();
      const transferEvent: Event[] | undefined = txReceipt.events;
      if (transferEvent != undefined && transferEvent.length > 0) {
        const result: Result | undefined = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        expect(minAddressArr).to.contains(result?.addr);
        expect(result?.value).to.equal(minValue);
      }
      
    });
  });

  describe("Get Value", function () {

    it("Get not existing address: Should revert if address not exist", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const address1: string = randomAddress();
      let address2: string = address1;
      while (address2 == address1) {
        address2 = randomAddress();
      }
      const value: number = randomInt(1, MAX_VALUE);
      await deployed.cappedSet.insert(address1, value);
      await expect(deployed.cappedSet.getValue(address2)).to.be.revertedWith("Not found this address");
    });

    it("Get  element with existing address: Retrieves the value for the element with address addr", async function () {
      const deployed: CappedSetDeploy = await deploy();
      const addressArr: string[] = [];
      const valueArr: number[] = [];
      const length = randomInt(3, MAX_LENGTH);
      for (let i: number = 0; i < length; i++) {
        addressArr[i] = randomAddress();
        valueArr[i] = randomInt(1, MAX_VALUE);
      }
      
      for (let i: number = 0; i < valueArr.length; i++) {
        // console.log(addressArr[i].address, ' => ', valueArr[i]);
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i], valueArr[i]);
        await txResponse.wait();
      }

      for (let i: number = 0; i < valueArr.length; i++) {
        const value = await deployed.cappedSet.getValue(addressArr[i]);
        expect(value).to.equal(valueArr[i]);
      }
      
    });
  });
});
