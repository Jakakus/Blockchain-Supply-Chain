# Blockchain Supply Chain Frontend

This is the React frontend application for the Blockchain Supply Chain Tracker project. It allows users to interact with the smart contract deployed on the Ethereum blockchain.

## Features

- Connect Wallet: Connect with your Ethereum wallet (MetaMask recommended)
- View Dashboard: Get an overview of all supply chain metrics
- Product Management: Register new products on the blockchain
- Transfer Ownership: Transfer product ownership to other Ethereum addresses
- Product Verification: Verify product authenticity and status
- Document Management: Attach IPFS document hashes to products

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

## Connecting to the Blockchain

Before using the application, you'll need:

1. MetaMask or another Ethereum wallet extension installed in your browser
2. Some ETH for gas fees on the network you're connected to
3. The contract deployed on your chosen network (see the main README for deployment instructions)

## Available Scripts

- `npm start`: Runs the app in development mode
- `npm run build`: Builds the app for production to the `build` folder
- `npm test`: Launches the test runner in interactive watch mode

## Project Structure

- `src/components/`: React components for the application UI
- `src/context/`: React context for managing application state
- `src/abis/`: ABI files for interacting with the smart contract 

## Testing the Application

You can test the application using a local Ethereum network:

1. In a separate terminal, start a local blockchain:
   ```
   npx hardhat node
   ```

2. Deploy the contract to the local network:
   ```
   npx hardhat run scripts/deploy.js --network localhost
   ```

3. Update the contract address in the `App.js` file with the deployed contract address

4. Connect MetaMask to the local network (usually http://localhost:8545)

## Interacting with the Contract

The application provides interfaces for:

- **Manufacturers**: Register new products
- **Distributors**: Transfer and update product status
- **Retailers**: Confirm product delivery and sales
- **Admins**: Verify products and manage roles

Each interaction requires signing a transaction with your Ethereum wallet.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 