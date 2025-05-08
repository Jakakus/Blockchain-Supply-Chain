import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Link } from 'react-router-dom';

// SVG Components for visualizations
const SupplyChainIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="15" width="60" height="50" rx="4" stroke="#3366FF" strokeWidth="2" fill="none"/>
    <rect x="20" y="25" width="40" height="10" rx="2" fill="#3366FF" opacity="0.2"/>
    <rect x="20" y="45" width="40" height="10" rx="2" fill="#3366FF" opacity="0.2"/>
    <path d="M40 25V55" stroke="#3366FF" strokeWidth="1.5" strokeDasharray="3 3"/>
    <path d="M20 40H60" stroke="#3366FF" strokeWidth="1.5" strokeDasharray="3 3"/>
    <circle cx="40" cy="40" r="5" fill="#3366FF"/>
    <circle cx="20" cy="30" r="3" fill="#3366FF"/>
    <circle cx="60" cy="50" r="3" fill="#3366FF"/>
  </svg>
);

const BlockchainIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="15" width="15" height="15" rx="2" fill="#3366FF" opacity="0.2" stroke="#3366FF" strokeWidth="2"/>
    <rect x="40" y="15" width="15" height="15" rx="2" fill="#3366FF" opacity="0.2" stroke="#3366FF" strokeWidth="2"/>
    <rect x="15" y="40" width="15" height="15" rx="2" fill="#3366FF" opacity="0.2" stroke="#3366FF" strokeWidth="2"/>
    <rect x="40" y="40" width="15" height="15" rx="2" fill="#3366FF" opacity="0.2" stroke="#3366FF" strokeWidth="2"/>
    <path d="M30 22.5H40" stroke="#3366FF" strokeWidth="2"/>
    <path d="M30 47.5H40" stroke="#3366FF" strokeWidth="2"/>
    <path d="M22.5 30V40" stroke="#3366FF" strokeWidth="2"/>
    <path d="M47.5 30V40" stroke="#3366FF" strokeWidth="2"/>
  </svg>
);

const AuthenticationIcon = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 15L60 25V40C60 48.2843 51.0457 55 40 55C28.9543 55 20 48.2843 20 40V25L40 15Z" fill="#3366FF" opacity="0.1" stroke="#3366FF" strokeWidth="2"/>
    <path d="M40 25V45" stroke="#3366FF" strokeWidth="2"/>
    <circle cx="40" cy="35" r="10" fill="#3366FF" opacity="0.2" stroke="#3366FF" strokeWidth="2"/>
    <path d="M35 35L38 38L45 31" stroke="#3366FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Dashboard = () => {
  const { isConnected, contract } = useWeb3();
  const [metrics, setMetrics] = useState({
    activeShipments: 0,
    pendingVerification: 0,
    completedToday: 0,
    verificationRate: 0,
    authAlerts: 0,
    avgVerificationTime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isConnected || !contract) {
        setLoading(false);
        return;
      }

      try {
        // For a real implementation, we would fetch these metrics from the blockchain
        // But for demo purposes, we're using sample data
        setMetrics({
          activeShipments: 428,
          pendingVerification: 12,
          completedToday: 156,
          verificationRate: 97.2,
          authAlerts: 3,
          avgVerificationTime: 1.2,
        });
        setLoading(false);
        
        // Trigger animation after data is loaded
        setTimeout(() => {
          setAnimated(true);
        }, 100);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isConnected, contract]);

  if (!isConnected) {
    return (
      <div className="not-connected">
        <h2>Dashboard</h2>
        <p>Please connect your wallet to view the dashboard.</p>
        <div className="not-connected-icon">🔗</div>
      </div>
    );
  }

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard-container">
      <h2>Supply Chain Dashboard</h2>
      
      <div className="dashboard-grid">
        <div className={`dashboard-card ${animated ? 'animated' : ''}`}>
          <h3>Active Shipments</h3>
          <div className="stats">
            <div className="stat-item">
              <h4 className="count-up">{metrics.activeShipments}</h4>
              <p>Active Shipments</p>
            </div>
            <div className="stat-item">
              <h4 className="count-up">{metrics.pendingVerification}</h4>
              <p>Pending Verification</p>
            </div>
            <div className="stat-item">
              <h4 className="count-up">{metrics.completedToday}</h4>
              <p>Completed Today</p>
            </div>
          </div>
        </div>
        
        <div className={`dashboard-card ${animated ? 'animated' : ''}`} style={{ animationDelay: '0.2s' }}>
          <h3>Verification Metrics</h3>
          <div className="stats">
            <div className="stat-item">
              <h4 className="count-up">{metrics.verificationRate}%</h4>
              <p>Verification Success Rate</p>
            </div>
            <div className="stat-item">
              <h4 className="count-up">{metrics.authAlerts}</h4>
              <p>Authentication Alerts</p>
            </div>
            <div className="stat-item">
              <h4 className="count-up">{metrics.avgVerificationTime} days</h4>
              <p>Average Verification Time</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`visualization-card ${animated ? 'animated' : ''}`} style={{ animationDelay: '0.4s' }}>
        <h3>Supply Chain Visualization</h3>
        <p>Real-time visualization of product journey times, verification rates, and supply chain incidents</p>
        <div className="visualization-placeholder">
          <SupplyChainIcon />
          <p>Supply Chain Dashboard Visualization</p>
        </div>
      </div>
      
      <div className={`visualization-card ${animated ? 'animated' : ''}`} style={{ animationDelay: '0.6s' }}>
        <h3>Smart Contract Architecture</h3>
        <p>Multi-layered smart contract architecture with upgradeable proxy pattern</p>
        <div className="visualization-placeholder">
          <BlockchainIcon />
          <p>Smart Contract Architecture Diagram</p>
        </div>
      </div>
      
      <div className={`visualization-card ${animated ? 'animated' : ''}`} style={{ animationDelay: '0.8s' }}>
        <h3>Authentication Flow</h3>
        <p>Secure product authentication process with blockchain verification</p>
        <div className="visualization-placeholder">
          <AuthenticationIcon />
          <p>Authentication Flow Diagram</p>
        </div>
      </div>
      
      <div className={`quick-actions ${animated ? 'animated' : ''}`} style={{ animationDelay: '1s' }}>
        <h3>Quick Actions</h3>
        <div className="actions-buttons">
          <Link to="/products" className="btn primary">View All Products</Link>
          <Link to="/register" className="btn secondary">Register New Product</Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 