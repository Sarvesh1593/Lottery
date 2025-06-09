const { ethers, network } = require("hardhat");

async function mockKeepers() {
  const raffleDeployment = await deployments.get("Raffle");
  const raffle = await ethers.getContractAt("Raffle", raffleDeployment.address);
  const checkData = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(""));
  console.log(`data is available  : ${checkData}`);
  const { upkeepNeeded } = await raffle.callStatic.checkUpkeep(checkData);
  console.log(`upkeepNeed : ${upkeepNeeded}`);
  if (upkeepNeeded) {
    const tx = await raffle.performUpkeep(checkData);
    const txReceipt = await tx.wait(1);
    const requestId = txReceipt.events[1].args.requestId;
    console.log(`Performed upkeep with RequestId: ${requestId}`);
    if (network.config.chainId == 31337) {
      await mockVrf(requestId, raffle);
    }
  } else {
    console.log("No upkeep needed!");
  }
}

async function mockVrf(requestId, raffle) {
  console.log("We on a local network? Ok let's pretend...");
  const vrfCoordinatorV2Mock = await ethers.getContractAt(
    "VRFCoordinatorV2Mock",
    (
      await deployments.get("VRFCoordinatorV2Mock")
    ).address
  );
  await vrfCoordinatorV2Mock.fulfillRandomWords(requestId, raffle.address);
  console.log("Responded!");
  const recentWinner = await raffle.getRecentWinner();
  console.log(`The winner is: ${recentWinner}`);
}

mockKeepers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
