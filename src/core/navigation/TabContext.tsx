/**
 * Tab Context
 * Context for managing tab navigation state
 */

import React, {createContext, useContext, useState, ReactNode} from 'react';

interface TabContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabContext = createContext<TabContextType | undefined>(undefined);

export const TabProvider: React.FC<{children: ReactNode}> = ({children}) => {
  const [activeTab, setActiveTab] = useState('Home');

  return (
    <TabContext.Provider value={{activeTab, setActiveTab}}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabNavigation = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabNavigation must be used within TabProvider');
  }
  return context;
};



