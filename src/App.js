import React, { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { ethers } from 'ethers';
import SupplyChainTrackerABI from './abis/SupplyChainTracker.json';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import ProductRegistration from './components/ProductRegistration';
import ProductDetail from './components/ProductDetail';
import TransferProduct from './components/TransferProduct';
import { Web3Provider } from './context/Web3Context';
import './styles.css';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [userAccount, setUserAccount] = useState('');
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const connectWallet = async () => {
    console.log("Connect wallet function called");
    setConnectionError(null);
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        console.error("MetaMask is not installed");
        setConnectionError("MetaMask is not installed. Please install MetaMask browser extension.");
        alert('MetaMask is not installed. Please install it to use this app.');
        setLoading(false);
        return;
      }
      
      console.log("Requesting accounts...");
      // Request accounts from MetaMask
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      console.log("Accounts received:", accounts);
      
      if (!accounts || accounts.length === 0) {
        console.error("No accounts found");
        setConnectionError("No accounts found. Please unlock your MetaMask.");
        setLoading(false);
        return;
      }
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      console.log("Provider created");
      
      const network = await provider.getNetwork();
      console.log("Connected to network:", network);
      
      const signer = provider.getSigner();
      console.log("Signer created");
      
      // Deployed contract address from Hardhat deployment
      const contractAddress = '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707'; 
      console.log("Using contract address:", contractAddress);
      
      const supplyChainContract = new ethers.Contract(
        contractAddress,
        SupplyChainTrackerABI.abi,
        signer
      );
      console.log("Contract instance created");

      try {
        // Check user roles
        console.log("Checking user roles...");
        const adminRole = await supplyChainContract.ADMIN_ROLE();
        const manufacturerRole = await supplyChainContract.MANUFACTURER_ROLE();
        const distributorRole = await supplyChainContract.DISTRIBUTOR_ROLE();
        const retailerRole = await supplyChainContract.RETAILER_ROLE();
        
        // Check which role the user has
        const isAdmin = await supplyChainContract.hasRole(adminRole, accounts[0]);
        const isManufacturer = await supplyChainContract.hasRole(manufacturerRole, accounts[0]);
        const isDistributor = await supplyChainContract.hasRole(distributorRole, accounts[0]);
        const isRetailer = await supplyChainContract.hasRole(retailerRole, accounts[0]);
        
        let role = 'viewer';
        if (isAdmin) role = 'admin';
        else if (isManufacturer) role = 'manufacturer';
        else if (isDistributor) role = 'distributor';
        else if (isRetailer) role = 'retailer';
        
        console.log("User role determined:", role);
        
        setUserRole(role);
        setUserAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setContract(supplyChainContract);
        setIsConnected(true);
        console.log("Connection successful, state updated");
      } catch (roleError) {
        console.error("Error checking roles:", roleError);
        // If role checking fails, still connect but as viewer
        setUserRole('viewer');
        setUserAccount(accounts[0]);
        setProvider(provider);
        setSigner(signer);
        setContract(supplyChainContract);
        setIsConnected(true);
        console.log("Connected as viewer due to role check failure");
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      setConnectionError(`Failed to connect: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  useEffect(() => {
    const checkConnection = async () => {
      console.log("Checking existing connections...");
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          console.log("Existing accounts:", accounts);
          if (accounts.length > 0) {
            connectWallet();
          } else {
            setLoading(false);
          }
        } catch (error) {
          console.error("Error checking connection:", error);
          setLoading(false);
        }
      } else {
        console.log("MetaMask not detected on initial check");
        setLoading(false);
      }
    };

    checkConnection();

    // Event listeners for account and chain changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log("Accounts changed:", accounts);
        if (accounts.length > 0) {
          connectWallet();
        } else {
          setIsConnected(false);
          setUserAccount('');
        }
      });

      window.ethereum.on('chainChanged', () => {
        console.log("Network changed, reconnecting...");
        connectWallet();
      });
    }

    // Close mobile menu when window is resized to desktop size
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Web3Provider value={{ isConnected, userAccount, provider, signer, contract, userRole }}>
      <div className="app">
        <header className="app-header">
          <div className="container">
            <div className="header-top">
              <h1>Blockchain Supply Chain Tracker</h1>
              <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
                <span className="menu-icon">{mobileMenuOpen ? '✕' : '☰'}</span>
              </button>
            </div>
            <nav className={mobileMenuOpen ? 'mobile-open' : ''}>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)}>Products</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Register Product</Link>
            </nav>
            <div className="wallet-status">
              {isConnected ? (
                <div className="connected">
                  <span className="account-info">{userAccount.slice(0, 6)}...{userAccount.slice(-4)}</span>
                  <span className="role-badge">{userRole}</span>
                </div>
              ) : (
                <div>
                  <button className="connect-button" onClick={connectWallet}>
                    Connect Wallet
                  </button>
                  {connectionError && <div className="error-message">{connectionError}</div>}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/register" element={<ProductRegistration />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/transfer/:id" element={<TransferProduct />} />
          </Routes>
        </main>

        <footer>
          <div className="container">
            <p>&copy; {new Date().getFullYear()} Blockchain Supply Chain Tracker | Powered by Ethereum</p>
          </div>
        </footer>
      </div>
    </Web3Provider>
  );
}

export default App; 