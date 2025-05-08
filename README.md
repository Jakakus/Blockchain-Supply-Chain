# Blockchain Supply Chain Tracker

A secure and transparent supply chain tracking system built on Ethereum blockchain technology, enabling product authentication, real-time tracking, and tamper-proof documentation throughout the supply chain journey.

## Overview

The Blockchain Supply Chain Tracker addresses critical challenges in modern supply chains:
- Product counterfeiting and authenticity verification
- Supply chain transparency and traceability
- Secure data sharing between participants
- Automated verification and compliance

By leveraging blockchain technology, this project creates an immutable record of a product's journey from manufacturer to end consumer, establishing trust and transparency across the entire supply chain.

## Key Features

- **Smart Contract Architecture**: Uses an upgradeable proxy pattern for future-proof deployment
- **Decentralized Product Registry**: Maintains product information on the blockchain
- **Cryptographic Verification**: Ensures authenticity at each step of the supply chain
- **Role-Based Access Control**: Granular permissions for different supply chain participants
- **Event Monitoring**: Real-time tracking of product movements and status changes
- **Document Management**: Secure storage of certificates and documentation on IPFS
- **Interactive Dashboard**: Real-time visualization of supply chain metrics and analytics

## Technical Stack

- **Blockchain**: Ethereum, Solidity, Hardhat
- **Frontend**: React, Web3.js, HTML/CSS
- **Backend**: Node.js, Express
- **Storage**: IPFS for decentralized document storage
- **Development**: Hardhat, Ethers.js, Waffle for testing

## Smart Contract Architecture

The project implements a sophisticated smart contract architecture:

1. **Proxy Pattern**: Allows contract upgrades while preserving data and state
2. **Access Control**: Role-based permissions using OpenZeppelin libraries
3. **Product Registry**: Manages product creation, details, and ownership
4. **Supply Chain Registry**: Tracks movements, transfers, and status changes
5. **Verification Contracts**: Handles cryptographic verification of products

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- NPM (v6 or higher)
- Metamask browser extension
- Hardhat

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/blockchain-supply-chain.git
   cd blockchain-supply-chain
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Compile smart contracts
   ```
   npx hardhat compile
   ```

4. Run local blockchain network
   ```
   npx hardhat node
   ```

5. Deploy contracts
   ```
   npx hardhat run scripts/deploy.js --network localhost
   ```

6. Start the frontend application
   ```
   npm run start
   ```

## Demo Application

The project includes a demo application showcasing key features:

- **Dashboard**: Real-time metrics of active shipments and verification status
- **Tracking Interface**: Monitor product location and status in real-time
- **Registration Form**: Register new products on the blockchain
- **Verification Tool**: Verify product authenticity via QR codes or IDs

## Future Development

- Integration with IoT sensors for automated tracking updates
- Mobile application for on-the-go verification
- Multi-chain implementation for cross-chain compatibility
- AI-powered analytics for supply chain optimization

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenZeppelin for secure smart contract libraries
- IPFS for decentralized storage capabilities
- The Ethereum community for resources and documentation 