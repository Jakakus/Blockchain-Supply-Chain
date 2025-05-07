// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @title ProductTracker
 * @dev Tracks products through the supply chain using NFTs
 */
contract ProductTracker is ERC721URIStorage, AccessControl, Initializable {
    using Counters for Counters.Counter;
    
    // Roles for access control
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
    bytes32 public constant CONSUMER_ROLE = keccak256("CONSUMER_ROLE");
    
    Counters.Counter private _tokenIds;
    
    // Product details
    struct ProductDetails {
        string productName;
        string manufacturer;
        uint256 manufacturingDate;
        string productionLocation;
        string[] supplyChainSteps;
        mapping(uint256 => SupplyChainStep) stepDetails;
        uint256 currentStep;
        bool isAuthentic;
    }
    
    // Supply chain step details
    struct SupplyChainStep {
        string location;
        uint256 timestamp;
        address handler;
        string handlerRole;
        string notes;
    }
    
    // Mapping token IDs to product details
    mapping(uint256 => ProductDetails) private _products;
    
    // Events
    event ProductCreated(uint256 tokenId, string productName, address manufacturer);
    event ProductTransferred(uint256 tokenId, address from, address to, string fromRole, string toRole);
    event SupplyChainStepAdded(uint256 tokenId, string location, string handlerRole);
    event ProductAuthenticated(uint256 tokenId, bool isAuthentic);
    
    /**
     * @dev Initialize the contract
     */
    function initialize(string memory name, string memory symbol) public initializer {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        __ERC721_init(name, symbol);
    }
    
    /**
     * @dev Create a new product with NFT
     * @param to Address receiving the token
     * @param productName Name of the product
     * @param manufacturer Name of the manufacturer
     * @param productionLocation Location where product was manufactured
     * @param tokenURI URI for token metadata
     */
    function createProduct(
        address to,
        string memory productName,
        string memory manufacturer,
        string memory productionLocation,
        string memory tokenURI
    ) public returns (uint256) {
        require(hasRole(MANUFACTURER_ROLE, msg.sender), "Must have manufacturer role");
        
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        _mint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        
        // Initialize the product
        ProductDetails storage product = _products[newTokenId];
        product.productName = productName;
        product.manufacturer = manufacturer;
        product.manufacturingDate = block.timestamp;
        product.productionLocation = productionLocation;
        product.currentStep = 0;
        product.isAuthentic = true;
        
        // Add first step in supply chain
        addSupplyChainStep(newTokenId, productionLocation, "Manufacturer", "Product created and authenticated");
        
        emit ProductCreated(newTokenId, productName, msg.sender);
        
        return newTokenId;
    }
    
    /**
     * @dev Add a step to the product's supply chain journey
     * @param tokenId ID of the product token
     * @param location Current location
     * @param handlerRole Role of the handler
     * @param notes Additional information
     */
    function addSupplyChainStep(
        uint256 tokenId,
        string memory location,
        string memory handlerRole,
        string memory notes
    ) public {
        require(_exists(tokenId), "Token does not exist");
        require(
            hasRole(MANUFACTURER_ROLE, msg.sender) ||
            hasRole(DISTRIBUTOR_ROLE, msg.sender) ||
            hasRole(RETAILER_ROLE, msg.sender),
            "Must have appropriate role"
        );
        
        ProductDetails storage product = _products[tokenId];
        uint256 stepIndex = product.currentStep;
        
        // Add step to array of steps
        product.supplyChainSteps.push(location);
        
        // Set details of the step
        SupplyChainStep storage step = product.stepDetails[stepIndex];
        step.location = location;
        step.timestamp = block.timestamp;
        step.handler = msg.sender;
        step.handlerRole = handlerRole;
        step.notes = notes;
        
        // Increment current step
        product.currentStep += 1;
        
        emit SupplyChainStepAdded(tokenId, location, handlerRole);
    }
    
    /**
     * @dev Transfer product to next entity in supply chain
     * @param to Address receiving the product
     * @param tokenId ID of the product token
     * @param fromRole Role of sender
     * @param toRole Role of receiver
     */
    function transferProduct(
        address to,
        uint256 tokenId,
        string memory fromRole,
        string memory toRole
    ) public {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved or owner");
        
        emit ProductTransferred(tokenId, msg.sender, to, fromRole, toRole);
        _transfer(msg.sender, to, tokenId);
    }
    
    /**
     * @dev Authenticate a product
     * @param tokenId ID of the product token
     * @param isAuthentic Authentication result
     */
    function authenticateProduct(uint256 tokenId, bool isAuthentic) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Must have admin role");
        require(_exists(tokenId), "Token does not exist");
        
        _products[tokenId].isAuthentic = isAuthentic;
        
        emit ProductAuthenticated(tokenId, isAuthentic);
    }
    
    /**
     * @dev Get product details
     * @param tokenId ID of the product token
     */
    function getProductBasicDetails(uint256 tokenId) public view returns (
        string memory productName,
        string memory manufacturer,
        uint256 manufacturingDate,
        string memory productionLocation,
        uint256 currentStep,
        bool isAuthentic
    ) {
        require(_exists(tokenId), "Token does not exist");
        ProductDetails storage product = _products[tokenId];
        
        return (
            product.productName,
            product.manufacturer,
            product.manufacturingDate,
            product.productionLocation,
            product.currentStep,
            product.isAuthentic
        );
    }
    
    /**
     * @dev Get supply chain step details
     * @param tokenId ID of the product token
     * @param stepIndex Index of step to retrieve
     */
    function getSupplyChainStep(uint256 tokenId, uint256 stepIndex) public view returns (
        string memory location,
        uint256 timestamp,
        address handler,
        string memory handlerRole,
        string memory notes
    ) {
        require(_exists(tokenId), "Token does not exist");
        require(stepIndex < _products[tokenId].currentStep, "Step does not exist");
        
        SupplyChainStep storage step = _products[tokenId].stepDetails[stepIndex];
        
        return (
            step.location,
            step.timestamp,
            step.handler,
            step.handlerRole,
            step.notes
        );
    }
    
    /**
     * @dev Override supportsInterface for ERC721 and AccessControl
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
} 