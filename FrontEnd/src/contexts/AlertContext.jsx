import React, { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alertsVersion, setAlertsVersion] = useState(0);

  const refreshAlerts = () => {
    setAlertsVersion(prev => prev + 1);
  };

  return (
    <AlertContext.Provider value={{ alertsVersion, refreshAlerts }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlertRefresh = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlertRefresh must be used within an AlertProvider');
  }
  return context;
};