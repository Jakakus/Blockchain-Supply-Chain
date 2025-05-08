import React, { createContext, useContext } from 'react';

// Create context
const Web3Context = createContext(null);

// Provider component
export const Web3Provider = ({ children, value }) => {
  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use the context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export default Web3Context; 