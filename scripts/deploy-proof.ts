import { ethers } from "ethers";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const rpcUrl = process.env.XLAYER_RPC_URL;
  const privateKey = process.env.PROOF_SIGNER_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("Missing XLAYER_RPC_URL or PROOF_SIGNER_PRIVATE_KEY");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  const abiPath = path.join(process.cwd(), "contracts", "abi", "ProofOfCoordination.json");
  if (!fs.existsSync(abiPath)) {
    throw new Error("Missing contracts/abi/ProofOfCoordination.json. Compile your contract first.");
  }

  const artifact = JSON.parse(fs.readFileSync(abiPath, "utf8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log("ProofOfCoordination deployed:", await contract.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
