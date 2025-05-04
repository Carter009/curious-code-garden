
import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';

export const Layout: React.FC = () => {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<string>('Not connected');
  
  // Check API connection status on component mount and when localStorage changes
  useEffect(() => {
    const checkApiStatus = () => {
      const useApi = localStorage.getItem('bybit_use_api') === 'true';
      const apiKey = localStorage.getItem('bybit_api_key');
      const apiSecret = localStorage.getItem('bybit_api_secret_temp');
      
      if (useApi && apiKey && apiSecret) {
        setApiStatus('API Key configured');
      } else if (useApi && apiKey) {
        setApiStatus('API Key saved (Secret needed)');
      } else {
        setApiStatus('Not connected');
      }
    };
    
    // Check status on mount
    checkApiStatus();
    
    // Set up a listener for changes to localStorage
    const handleStorageChange = () => {
      checkApiStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Custom event for when settings are saved in AdminPanel
    const handleSettingsSaved = () => {
      checkApiStatus();
    };
    
    window.addEventListener('bybit_settings_changed', handleSettingsSaved);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bybit_settings_changed', handleSettingsSaved);
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
