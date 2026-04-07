// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract ProofOfCoordination {
    struct Proof {
        address actor;
        string label;
        string summary;
        string executionId;
        string proofHash;
        uint256 timestamp;
    }

    bytes32[] public proofIds;
    mapping(bytes32 => Proof) public proofs;

    event ProofRecorded(
        bytes32 indexed proofId,
        address indexed actor,
        string label,
        string executionId,
        uint256 timestamp
    );

    function recordProof(
        address actor,
        string memory label,
        string memory summary,
        string memory executionId,
        string memory proofHash
    ) public returns (bytes32) {
        bytes32 proofId = keccak256(
            abi.encodePacked(actor, label, summary, executionId, proofHash, block.timestamp)
        );

        proofs[proofId] = Proof({
            actor: actor,
            label: label,
            summary: summary,
            executionId: executionId,
            proofHash: proofHash,
            timestamp: block.timestamp
        });

        proofIds.push(proofId);
        emit ProofRecorded(proofId, actor, label, executionId, block.timestamp);
        return proofId;
    }

    function getProofCount() external view returns (uint256) {
        return proofIds.length;
    }
}
