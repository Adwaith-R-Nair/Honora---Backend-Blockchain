// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title EvidenceRegistry
 * @notice Secure blockchain-based evidence management system.
 *         Stores evidence metadata and full chain-of-custody history on-chain.
 *         Actual files are stored off-chain on IPFS (via Pinata).
 * @dev Phase 1 — Local Hardhat deployment
 */
contract EvidenceRegistry {

    // -------------------------------------------------------------------------
    // State Variables
    // -------------------------------------------------------------------------

    address public owner;
    uint256 public evidenceCount;

    mapping(address => bool) public authorizedUploaders;
    mapping(uint256 => Evidence) private evidences;
    mapping(uint256 => CustodyRecord[]) private custodyHistory;
    mapping(string => bool) private fileHashExists;

    // -------------------------------------------------------------------------
    // Structs
    // -------------------------------------------------------------------------

    struct Evidence {
        uint256 evidenceId;
        uint256 caseId;
        string ipfsCID;
        string fileHash;
        address uploadedBy;
        uint256 timestamp;
        address currentHolder;
        bool exists;
    }

    struct CustodyRecord {
        address from;
        address to;
        uint256 timestamp;
    }

    // -------------------------------------------------------------------------
    // Events
    // -------------------------------------------------------------------------

    event EvidenceAdded(
        uint256 indexed evidenceId,
        uint256 indexed caseId,
        string ipfsCID,
        string fileHash,
        address indexed uploadedBy,
        uint256 timestamp
    );

    event CustodyTransferred(
        uint256 indexed evidenceId,
        address indexed previousHolder,
        address indexed newHolder,
        uint256 timestamp
    );

    event UploaderAuthorized(address indexed account, uint256 timestamp);
    event UploaderRevoked(address indexed account, uint256 timestamp);

    // -------------------------------------------------------------------------
    // Custom Errors
    // -------------------------------------------------------------------------

    error NotOwner();
    error NotAuthorized();
    error EvidenceNotFound(uint256 evidenceId);
    error NotCurrentHolder(uint256 evidenceId, address caller);
    error InvalidAddress();
    error EmptyField(string fieldName);
    error DuplicateFileHash(string fileHash);

    // -------------------------------------------------------------------------
    // Modifiers
    // -------------------------------------------------------------------------

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyAuthorized() {
        if (!authorizedUploaders[msg.sender]) revert NotAuthorized();
        _;
    }

    modifier evidenceExists(uint256 _evidenceId) {
        if (!evidences[_evidenceId].exists) revert EvidenceNotFound(_evidenceId);
        _;
    }

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor() {
        owner = msg.sender;
        // Owner is authorized to upload by default
        authorizedUploaders[msg.sender] = true;
        emit UploaderAuthorized(msg.sender, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Admin Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Authorize a new address to upload evidence
     * @param _account Address to authorize
     */
    function authorizeUploader(address _account) external onlyOwner {
        if (_account == address(0)) revert InvalidAddress();
        authorizedUploaders[_account] = true;
        emit UploaderAuthorized(_account, block.timestamp);
    }

    /**
     * @notice Revoke upload authorization from an address
     * @param _account Address to revoke
     */
    function revokeUploader(address _account) external onlyOwner {
        if (_account == address(0)) revert InvalidAddress();
        authorizedUploaders[_account] = false;
        emit UploaderRevoked(_account, block.timestamp);
    }

    // -------------------------------------------------------------------------
    // Core Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Register new evidence on-chain
     * @param _caseId Unique case identifier
     * @param _ipfsCID IPFS content identifier for the off-chain file
     * @param _fileHash SHA-256 hash of the evidence file for integrity verification
     */
    function addEvidence(
        uint256 _caseId,
        string memory _ipfsCID,
        string memory _fileHash
    ) external onlyAuthorized {
        // Input validation
        if (bytes(_ipfsCID).length == 0) revert EmptyField("ipfsCID");
        if (bytes(_fileHash).length == 0) revert EmptyField("fileHash");

        // Duplicate file hash check
        if (fileHashExists[_fileHash]) revert DuplicateFileHash(_fileHash);

        evidenceCount++;
        uint256 newEvidenceId = evidenceCount;

        // Store evidence
        evidences[newEvidenceId] = Evidence({
            evidenceId: newEvidenceId,
            caseId: _caseId,
            ipfsCID: _ipfsCID,
            fileHash: _fileHash,
            uploadedBy: msg.sender,
            timestamp: block.timestamp,
            currentHolder: msg.sender,
            exists: true
        });

        // Mark file hash as seen
        fileHashExists[_fileHash] = true;

        // Record initial custody entry
        custodyHistory[newEvidenceId].push(CustodyRecord({
            from: address(0),
            to: msg.sender,
            timestamp: block.timestamp
        }));

        emit EvidenceAdded(
            newEvidenceId,
            _caseId,
            _ipfsCID,
            _fileHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @notice Transfer custody of evidence to a new holder
     * @param _evidenceId ID of the evidence to transfer
     * @param _newHolder Address of the new custodian
     */
    function transferCustody(
        uint256 _evidenceId,
        address _newHolder
    ) external evidenceExists(_evidenceId) {
        if (_newHolder == address(0)) revert InvalidAddress();

        Evidence storage evidence = evidences[_evidenceId];

        if (evidence.currentHolder != msg.sender)
            revert NotCurrentHolder(_evidenceId, msg.sender);

        address previousHolder = evidence.currentHolder;
        evidence.currentHolder = _newHolder;

        // Append to on-chain custody history
        custodyHistory[_evidenceId].push(CustodyRecord({
            from: previousHolder,
            to: _newHolder,
            timestamp: block.timestamp
        }));

        emit CustodyTransferred(
            _evidenceId,
            previousHolder,
            _newHolder,
            block.timestamp
        );
    }

    // -------------------------------------------------------------------------
    // View Functions
    // -------------------------------------------------------------------------

    /**
     * @notice Get full evidence metadata by ID
     * @param _evidenceId ID of the evidence
     * @return Evidence struct
     */
    function getEvidence(
        uint256 _evidenceId
    ) external view evidenceExists(_evidenceId) returns (Evidence memory) {
        return evidences[_evidenceId];
    }

    /**
     * @notice Get full custody history for a piece of evidence
     * @param _evidenceId ID of the evidence
     * @return Array of CustodyRecord structs
     */
    function getCustodyHistory(
        uint256 _evidenceId
    ) external view evidenceExists(_evidenceId) returns (CustodyRecord[] memory) {
        return custodyHistory[_evidenceId];
    }

    /**
     * @notice Check if a file hash has already been registered
     * @param _fileHash SHA-256 hash to check
     * @return bool
     */
    function isFileHashRegistered(
        string memory _fileHash
    ) external view returns (bool) {
        return fileHashExists[_fileHash];
    }

    /**
     * @notice Check if an address is an authorized uploader
     * @param _account Address to check
     * @return bool
     */
    function isAuthorized(
        address _account
    ) external view returns (bool) {
        return authorizedUploaders[_account];
    }
}
