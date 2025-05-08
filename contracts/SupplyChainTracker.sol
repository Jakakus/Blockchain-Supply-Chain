// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title SupplyChainTracker
 * @dev Main contract for tracking products through a supply chain using blockchain
 */
contract SupplyChainTracker is Initializable, AccessControlUpgradeable, PausableUpgradeable, UUPSUpgradeable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");

    enum ProductStatus { Created, InTransit, Delivered, Sold }

    struct Product {
        uint256 id;
        string name;
        string manufacturer;
        address currentOwner;
        uint256 productionDate;
        uint256 lastUpdated;
        ProductStatus status;
        bool isVerified;
        string[] documents; // IPFS hashes to related documents
    }

    struct Transfer {
        uint256 transferId;
        uint256 productId;
        address from;
        address to;
        uint256 timestamp;
        string location;
        bytes signature;
    }

    // Mappings
    mapping(uint256 => Product) private _products;
    mapping(uint256 => Transfer[]) private _productTransfers;
    mapping(address => uint256[]) private _ownedProducts;
    
    uint256 private _productIdCounter;
    uint256 private _transferIdCounter;

    // Events
    event ProductRegistered(uint256 indexed productId, string name, address indexed manufacturer);
    event ProductTransferred(uint256 indexed transferId, uint256 indexed productId, address indexed from, address to);
    event ProductStatusUpdated(uint256 indexed productId, ProductStatus status);
    event ProductVerified(uint256 indexed productId, address verifier);
    event DocumentAdded(uint256 indexed productId, string documentHash);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initializes the contract with default admin role
     */
    function initialize(address defaultAdmin) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        
        _productIdCounter = 1;
        _transferIdCounter = 1;
    }

    /**
     * @dev Registers a new product on the blockchain
     */
    function registerProduct(
        string memory name,
        string memory manufacturer,
        string[] memory initialDocuments
    ) public whenNotPaused onlyRole(MANUFACTURER_ROLE) returns (uint256) {
        uint256 productId = _productIdCounter++;
        
        Product storage product = _products[productId];
        product.id = productId;
        product.name = name;
        product.manufacturer = manufacturer;
        product.currentOwner = msg.sender;
        product.productionDate = block.timestamp;
        product.lastUpdated = block.timestamp;
        product.status = ProductStatus.Created;
        product.isVerified = true;
        
        // Add documents if any
        for (uint256 i = 0; i < initialDocuments.length; i++) {
            product.documents.push(initialDocuments[i]);
            emit DocumentAdded(productId, initialDocuments[i]);
        }
        
        // Add to owner's products
        _ownedProducts[msg.sender].push(productId);
        
        emit ProductRegistered(productId, name, msg.sender);
        
        return productId;
    }

    /**
     * @dev Transfers a product to a new owner
     */
    function transferProduct(
        uint256 productId,
        address to,
        string memory location,
        bytes memory signature
    ) public whenNotPaused returns (uint256) {
        require(_products[productId].id != 0, "Product does not exist");
        require(_products[productId].currentOwner == msg.sender, "Not the product owner");
        require(to != address(0), "Invalid recipient address");
        
        // Create transfer record
        uint256 transferId = _transferIdCounter++;
        Transfer memory transfer = Transfer({
            transferId: transferId,
            productId: productId,
            from: msg.sender,
            to: to,
            timestamp: block.timestamp,
            location: location,
            signature: signature
        });
        
        _productTransfers[productId].push(transfer);
        
        // Update product owner
        _products[productId].currentOwner = to;
        _products[productId].lastUpdated = block.timestamp;
        _products[productId].status = ProductStatus.InTransit;
        
        // Update ownership trackers
        _ownedProducts[to].push(productId);
        
        // Remove from previous owner's list
        for (uint256 i = 0; i < _ownedProducts[msg.sender].length; i++) {
            if (_ownedProducts[msg.sender][i] == productId) {
                // Replace with the last element and pop
                _ownedProducts[msg.sender][i] = _ownedProducts[msg.sender][_ownedProducts[msg.sender].length - 1];
                _ownedProducts[msg.sender].pop();
                break;
            }
        }
        
        emit ProductTransferred(transferId, productId, msg.sender, to);
        emit ProductStatusUpdated(productId, ProductStatus.InTransit);
        
        return transferId;
    }

    /**
     * @dev Updates the status of a product
     */
    function updateProductStatus(uint256 productId, ProductStatus status) 
        public 
        whenNotPaused 
    {
        require(_products[productId].id != 0, "Product does not exist");
        require(_products[productId].currentOwner == msg.sender, "Not the product owner");
        
        _products[productId].status = status;
        _products[productId].lastUpdated = block.timestamp;
        
        emit ProductStatusUpdated(productId, status);
    }

    /**
     * @dev Verify a product authenticity
     */
    function verifyProduct(uint256 productId) 
        public 
        whenNotPaused 
        onlyRole(ADMIN_ROLE) 
    {
        require(_products[productId].id != 0, "Product does not exist");
        
        _products[productId].isVerified = true;
        _products[productId].lastUpdated = block.timestamp;
        
        emit ProductVerified(productId, msg.sender);
    }

    /**
     * @dev Adds a document to a product
     */
    function addDocument(uint256 productId, string memory documentHash) 
        public 
        whenNotPaused 
    {
        require(_products[productId].id != 0, "Product does not exist");
        require(_products[productId].currentOwner == msg.sender, "Not the product owner");
        
        _products[productId].documents.push(documentHash);
        _products[productId].lastUpdated = block.timestamp;
        
        emit DocumentAdded(productId, documentHash);
    }

    // Read functions
    
    /**
     * @dev Get product details
     */
    function getProduct(uint256 productId) 
        public 
        view 
        returns (
            uint256 id,
            string memory name,
            string memory manufacturer,
            address currentOwner,
            uint256 productionDate,
            uint256 lastUpdated,
            ProductStatus status,
            bool isVerified
        ) 
    {
        require(_products[productId].id != 0, "Product does not exist");
        
        Product storage product = _products[productId];
        return (
            product.id,
            product.name,
            product.manufacturer,
            product.currentOwner,
            product.productionDate,
            product.lastUpdated,
            product.status,
            product.isVerified
        );
    }
    
    /**
     * @dev Get a product's documents
     */
    function getProductDocuments(uint256 productId) 
        public 
        view 
        returns (string[] memory) 
    {
        require(_products[productId].id != 0, "Product does not exist");
        return _products[productId].documents;
    }
    
    /**
     * @dev Get product transfer history
     */
    function getProductTransferHistory(uint256 productId) 
        public 
        view 
        returns (Transfer[] memory) 
    {
        require(_products[productId].id != 0, "Product does not exist");
        return _productTransfers[productId];
    }
    
    /**
     * @dev Get products owned by an address
     */
    function getProductsByOwner(address owner) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return _ownedProducts[owner];
    }

    // Role management functions
    
    /**
     * @dev Add a manufacturer role
     */
    function addManufacturer(address account) 
        public 
        onlyRole(ADMIN_ROLE) 
    {
        _grantRole(MANUFACTURER_ROLE, account);
    }
    
    /**
     * @dev Add a distributor role
     */
    function addDistributor(address account) 
        public 
        onlyRole(ADMIN_ROLE) 
    {
        _grantRole(DISTRIBUTOR_ROLE, account);
    }
    
    /**
     * @dev Add a retailer role
     */
    function addRetailer(address account) 
        public 
        onlyRole(ADMIN_ROLE) 
    {
        _grantRole(RETAILER_ROLE, account);
    }

    // Admin functions
    
    /**
     * @dev Pause the contract
     */
    function pause() public onlyRole(ADMIN_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() public onlyRole(ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * @dev Function to authorize the upgrade, restricted to admin
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(ADMIN_ROLE)
        override
    {}
} 