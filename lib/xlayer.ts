import { keccak256, toUtf8Bytes } from "ethers";

export const proofAbi = [
  "function recordProof(address actor,string memory label,string memory summary,string memory executionId,string memory proofHash) public returns (bytes32)",
];

export function buildProofHash(input: {
  prompt: string;
  summary: string;
  executionId?: string;
}) {
  const raw = `${input.prompt}|${input.summary}|${input.executionId || ""}`;
  return keccak256(toUtf8Bytes(raw));
}
