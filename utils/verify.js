const { run } = require("hardhat");

const verify = async (contractaddress, args) => {
  console.log("Verifying.... contract ");
  try {
    await run("verify", {
      address: contractaddress,
      constructorArguments: args, // note: plural
    });
  } catch (e) {
    if (e.message.toLowerCase().includes("already verified")) {
      console.log("Already Verified");
    } else {
      console.log(e);
    }
  }
};

module.exports = { verify };
