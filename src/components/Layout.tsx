
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { CredentialsService } from '@/services/CredentialsService';

export const Layout: React.FC = () => {
  const { user } = useSupabaseAuth();
  const [apiStatus, setApiStatus] = useState<string>('Not connected');
  
  // Check API connection status on component mount and when localStorage changes
  useEffect(() => {
    const checkApiStatus = () => {
      setApiStatus(CredentialsService.getApiStatusText());
    };
    
    // Check status on mount
    checkApiStatus();
    
    // Set up a listener for credentials changes
    const handleCredentialsChanged = () => {
      checkApiStatus();
    };
    
    window.addEventListener('bybit_credentials_changed', handleCredentialsChanged);
    
    // Also listen for localStorage changes from other tabs/windows
    window.addEventListener('storage', handleCredentialsChanged);
    
    return () => {
      window.removeEventListener('bybit_credentials_changed', handleCredentialsChanged);
      window.removeEventListener('storage', handleCredentialsChanged);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1">
        {user && <Sidebar />}
        <div className="flex flex-col flex-1">
          <Header />
          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Footer with API status */}
      <footer className="py-3 px-6 border-t text-xs text-gray-500 flex justify-between items-center">
        <div>Bybit P2P Order Manager v1.0.0</div>
        <div className="flex items-center gap-2">
          <span>Bybit API: </span>
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            apiStatus === 'Not connected' 
              ? 'bg-gray-200' 
              : apiStatus.includes('Secret needed')
                ? 'bg-amber-100 text-amber-800'
                : 'bg-green-100 text-green-800'
          }`}>
            {apiStatus}
          </span>
        </div>
      </footer>
    </div>
  );
};
