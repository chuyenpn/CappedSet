import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import * as Contracts from "../typechain-types";
import type {
  ContractTransaction,
  ContractReceipt,
  Event,
  BigNumber
} from "ethers";

import { Result } from "@ethersproject/abi";

const EVENT_CATCH_LOWEST_ITEM = 'LowestItem';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

interface CappedSetDeploy {
  cappedSet: Contracts.CappedSet
}

describe("CappedSet", function () {
  async function deploy(): Promise<CappedSetDeploy> {
    const n: number = 5;
    const CappedSetDeploy: Contracts.CappedSet__factory = await ethers.getContractFactory("CappedSet");
    const cappedSet: Contracts.CappedSet = await CappedSetDeploy.deploy(n);
    const addressArr: SignerWithAddress[] = await ethers.getSigners();

    return { cappedSet };
  }

  describe("Insert", function () {
    it("Should return address(0) and value 0 in the first time", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const value1: number = 1;
      const txResponse: ContractTransaction  = await deployed.cappedSet.insert(addressArr[0].address, value1);
      const txReceipt: ContractReceipt = await txResponse.wait();
      const transferEvent: Event[] | undefined = txReceipt.events;
      if (transferEvent != undefined && transferEvent.length > 0) {
        const result: Result | undefined = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        expect(result?.addr).to.equal(ethers.constants.AddressZero);
        expect(result?.value).to.equal(0);
      }

    });

    it("Should revert if address has already been inserted", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const value1: number = 1;
      const txResponse: ContractTransaction  = await deployed.cappedSet.insert(addressArr[0].address, value1);
      await txResponse.wait();

      const value2: number = 2;
      await expect(deployed.cappedSet.insert(addressArr[0].address, value2)).to.be.revertedWith("This address has been inserted. Use function update to update its value");
    });

    it("Should return lowest address and lowest value", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const valueArr: number[] = [2, 1, 1, 3, 8, 7];
      let minValue: number = 9999;
      let maxValue: number = 0;
      for (let i: number = 0; i < valueArr.length; i++) {
        if (valueArr[i] < minValue) {
          minValue = valueArr[i];
        }

        if (valueArr[i] > maxValue) {
          maxValue = valueArr[i];
        }
      }

      // find min addresses
      const minAddressArr: string[] = [];
      for (let i = 0; i < valueArr.length; i++) {
        if (valueArr[i] == minValue) {
          minAddressArr.push(addressArr[i].address);
        }
      }
      
      let result: Result | undefined;
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i].address, valueArr[i]);
        const txReceipt: ContractReceipt = await txResponse.wait();
        const transferEvent: Event[] | undefined = txReceipt.events;
        if (transferEvent != undefined && transferEvent.length > 0) {
          result = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        }
      }
      
      expect(minAddressArr).to.contains(result?.addr);
      expect(result?.value).to.equal(minValue);
    });

    it("When the set gets too big, it should boot out the element with the lowest value", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const valueArr: number[] = [3, 2, 1, 4, 5, 6, 7, 8, 9, 10];
      
      let result: Result | undefined;
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i].address, valueArr[i]);
        const txReceipt: ContractReceipt = await txResponse.wait();
        const transferEvent: Event[] | undefined = txReceipt.events;
        if (transferEvent != undefined && transferEvent.length > 0) {
          result = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        }
      }

      let minAddress: string = result?.addr;

      const txResponse1: ContractTransaction = await deployed.cappedSet.insert(addressArr[valueArr.length].address, valueArr[valueArr.length - 1]);
      const txReceipt1: ContractReceipt = await txResponse1.wait();
      const transferEvent1: Event[] | undefined = txReceipt1.events;
      if (transferEvent1 != undefined && transferEvent1.length > 0) {
        const result: Result | undefined = transferEvent1.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        expect(result?.addr).to.not.equal(minAddress);
      }
    });
  });

  describe("Update", function () {
    it("Should revert if address has not been inserted", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const value1: number = 1;
      const value2: number = 2;
      await deployed.cappedSet.insert(addressArr[0].address, value1);
      await expect(deployed.cappedSet.update(addressArr[1].address, value2)).to.be.revertedWith("This address has not been inserted. Use function insert to insert its value first");
    });

    it("Should update the address with new value", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const valueArr: number[] = [6, 4, 5, 7, 1, 9];
      
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i].address, valueArr[i]);
        await txResponse.wait();
      }

      //update
      let indexUpdate = randomInt(0, valueArr.length - 1);
      let addressUpdate = addressArr[indexUpdate].address;
      let valueUpdate = valueArr[indexUpdate] + randomInt(1, 100);
      const txResponse: ContractTransaction = await deployed.cappedSet.update(addressUpdate, valueUpdate);
      await txResponse.wait();
      const value: BigNumber = await deployed.cappedSet.getValue(addressUpdate);
      expect(value).to.equal(valueUpdate);
    });

    it("Should return lowest address and lowest value after update", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const valueArr: number[] = [6, 4, 5, 7, 1];
      let minValue: number = 9999;
      let maxValue: number = 0;
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
          minAddressArr.push(addressArr[i].address);
        }
      }
      
      for (let i: number = 0; i < valueArr.length; i++) {
        // console.log(addressArr[i].address, ' => ', valueArr[i]);
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i].address, valueArr[i]);
        await txResponse.wait();
      }

      let indexUpdate = maxIndex;
      let addressUpdate = addressArr[indexUpdate].address;
      // console.log('addressUpdate === ', addressUpdate)
      const txResponse: ContractTransaction = await deployed.cappedSet.update(addressUpdate, maxValue + 1);
      const txReceipt: ContractReceipt = await txResponse.wait();
      const transferEvent: Event[] | undefined = txReceipt.events;
      if (transferEvent != undefined && transferEvent.length > 0) {
        const result: Result | undefined = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        // console.log('result === ', result)
        expect(minAddressArr).to.contains(result?.addr);
        expect(result?.value).to.equal(minValue);
      }
      
    });
  });

  describe("Delete", function () {
    it("Should revert if address has not been inserted", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const value1: number = 1;
      const value2: number = 2;
      await deployed.cappedSet.insert(addressArr[0].address, value1);
      await expect(deployed.cappedSet.remove(addressArr[1].address)).to.be.revertedWith("This address has not been inserted");
    });

    it("Should delete the address", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const valueArr: number[] = [6, 4, 5, 7, 1, 9];
      
      for (let i: number = 0; i < valueArr.length; i++) {
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i].address, valueArr[i]);
        await txResponse.wait();
      }

      //update
      let indexDelete = randomInt(0, valueArr.length - 1);
      let addressDelete = addressArr[indexDelete].address;
      const txResponse: ContractTransaction = await deployed.cappedSet.remove(addressDelete);
      await txResponse.wait();
      await expect(deployed.cappedSet.getValue(addressDelete)).to.be.revertedWith("Not found this address");
    });

    it("Should return lowest address and lowest value after delete", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const valueArr: number[] = [6, 4, 5, 7, 1];
      let minValue: number = 9999;
      let maxValue: number = 0;
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
          minAddressArr.push(addressArr[i].address);
        }
      }
      
      for (let i: number = 0; i < valueArr.length; i++) {
        // console.log(addressArr[i].address, ' => ', valueArr[i]);
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i].address, valueArr[i]);
        await txResponse.wait();
      }

      let indexDelete = maxIndex;
      let addressDelete = addressArr[indexDelete].address;
      // console.log('addressUpdate === ', addressUpdate)
      const txResponse: ContractTransaction = await deployed.cappedSet.remove(addressDelete);
      const txReceipt: ContractReceipt = await txResponse.wait();
      const transferEvent: Event[] | undefined = txReceipt.events;
      if (transferEvent != undefined && transferEvent.length > 0) {
        const result: Result | undefined = transferEvent.find((t) => t.event == EVENT_CATCH_LOWEST_ITEM )?.args;
        // console.log('result === ', result)
        expect(minAddressArr).to.contains(result?.addr);
        expect(result?.value).to.equal(minValue);
      }
      
    });
  });

  describe("Get Value", function () {

    it("Should revert if address not exist", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const value1: number = 1;
      await deployed.cappedSet.insert(addressArr[0].address, value1);
      await expect(deployed.cappedSet.getValue(addressArr[1].address)).to.be.revertedWith("Not found this address");
    });

    it("Retrieves the value for the element with address addr", async function () {
      const addressArr: SignerWithAddress[] = await ethers.getSigners();
      const deployed: CappedSetDeploy = await deploy();
      const valueArr: number[] = [6, 4, 5, 7, 1];
      
      for (let i: number = 0; i < valueArr.length; i++) {
        // console.log(addressArr[i].address, ' => ', valueArr[i]);
        const txResponse: ContractTransaction = await deployed.cappedSet.insert(addressArr[i].address, valueArr[i]);
        await txResponse.wait();
      }

      for (let i: number = 0; i < valueArr.length; i++) {
        const value = await deployed.cappedSet.getValue(addressArr[i].address);
        expect(value).to.equal(valueArr[i]);
      }
      
    });
  });
});
