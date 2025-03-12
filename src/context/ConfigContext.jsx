import React, { createContext, useContext } from "react";
import { siteConfig } from "../config.js";

// Create the context with siteConfig as default value
export const ConfigContext = createContext(siteConfig);

// Provider component to wrap around the app
export function ConfigProvider({ children }) {
  return (
    <ConfigContext.Provider value={siteConfig}>
      {children}
    </ConfigContext.Provider>
  );
}

// Custom hook for easier access to the config
export function useConfig() {
  const config = useContext(ConfigContext);
  
  if (config === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  
  return config;
}
