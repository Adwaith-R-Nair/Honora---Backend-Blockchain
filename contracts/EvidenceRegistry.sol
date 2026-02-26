// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EvidenceRegistry {

    struct Evidence {
        uint256 caseId;
        string ipfsCID;
        string fileHash;
        address uploadedBy;
        uint256 timestamp;
        address currentHolder;
    }

    uint256 public evidenceCount;

    mapping(uint256 => Evidence) public evidences;

    event EvidenceAdded(
        uint256 indexed evidenceId,
        uint256 caseId,
        string ipfsCID,
        string fileHash,
        address uploadedBy,
        uint256 timestamp
    );

    event CustodyTransferred(
        uint256 indexed evidenceId,
        address previousHolder,
        address newHolder
    );

    function addEvidence(
        uint256 _caseId,
        string memory _ipfsCID,
        string memory _fileHash
    ) public {

        evidenceCount++;

        evidences[evidenceCount] = Evidence({
            caseId: _caseId,
            ipfsCID: _ipfsCID,
            fileHash: _fileHash,
            uploadedBy: msg.sender,
            timestamp: block.timestamp,
            currentHolder: msg.sender
        });

        emit EvidenceAdded(
            evidenceCount,
            _caseId,
            _ipfsCID,
            _fileHash,
            msg.sender,
            block.timestamp
        );
    }

    function transferCustody(
        uint256 _evidenceId,
        address _newHolder
    ) public {

        require(
            evidences[_evidenceId].currentHolder == msg.sender,
            "Not authorized to transfer"
        );

        address previousHolder = evidences[_evidenceId].currentHolder;

        evidences[_evidenceId].currentHolder = _newHolder;

        emit CustodyTransferred(
            _evidenceId,
            previousHolder,
            _newHolder
        );
    }

    function getEvidence(
        uint256 _evidenceId
    ) public view returns (Evidence memory) {
        return evidences[_evidenceId];
    }
}