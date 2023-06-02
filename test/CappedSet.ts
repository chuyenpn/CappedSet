import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CappedSet", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deploy() {
    const n = 5;
    const CappedSet = await ethers.getContractFactory("CappedSet");
    const cappedSet = await CappedSet.deploy(n);

    return { cappedSet };
  }

  describe("Insert", function () {
    it("Should return address(0) and value 0 in the first time", async function () {
      const { cappedSet } = await loadFixture(deploy);
      const [addr1, addr2] = await ethers.getSigners();
      const value1 = 1;
      const value2 = 2;
      const txResponse = await cappedSet.insert(addr1.address, value1);
      const txReceipt = await txResponse.wait();
      const [transferEvent] = txReceipt.events;
      const { addr, value } = transferEvent.args;
      // console.log('1 === ', transferEvent.args);
      // console.log('ethers.constants.AddressZero ', ethers.constants.AddressZero)

      expect(addr).to.equal(ethers.constants.AddressZero);
      expect(value).to.equal(0);

      // const txResponse2 = await cappedSet.insert(addr2.address, value2);
      // const txReceipt2 = await txResponse2.wait();
      // const [transferEvent2] = txReceipt2.events;
      // console.log('add2 === ', transferEvent2.args);

      // expect(await lock.unlockTime()).to.equal(unlockTime);
    });

  });


});
