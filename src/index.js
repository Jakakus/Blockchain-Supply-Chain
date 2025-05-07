import React from 'react';
import ReactDOM from 'react-dom';
import ProductTracking from './components/ProductTracking';
import './styles.css';

ReactDOM.render(
  <React.StrictMode>
    <div className="app-container">
      <header className="app-header">
        <h1>Blockchain Supply Chain Tracker</h1>
        <p>Track and verify products securely using Ethereum blockchain</p>
      </header>
      
      <main className="app-main">
        <ProductTracking />
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2025 Jakakus - Blockchain Supply Chain Tracker</p>
      </footer>
    </div>
  </React.StrictMode>,
  document.getElementById('root')
); 