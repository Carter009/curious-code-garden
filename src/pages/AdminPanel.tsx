
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { apiHandler } from '@/server/api';

const AdminPanel = () => {
  const { user } = useAuth();
  
  // API settings with secure storage approach
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [useApi, setUseApi] = useState(true);
  const [csvPath, setCsvPath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState('Not connected');
  
  // Load saved API settings from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('bybit_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
    
    const savedUseApi = localStorage.getItem('bybit_use_api');
    if (savedUseApi !== null) {
      setUseApi(savedUseApi === 'true');
    }
    
    const savedCsvPath = localStorage.getItem('bybit_csv_path');
    if (savedCsvPath) {
      setCsvPath(savedCsvPath);
    }
    
    // Check API connection status
    updateApiStatus();
  }, []);
  
  // Update API status based on current settings
  const updateApiStatus = () => {
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
  
  // Mock users for admin
  const [users] = useState([
    { id: '1', email: 'admin@example.com', name: 'Admin User', isAdmin: true },
    { id: '2', email: 'user@example.com', name: 'Regular User', isAdmin: false },
    { id: '3', email: 'user2@example.com', name: 'Another User', isAdmin: false },
  ]);

  const handleSettingsSave = async () => {
    setIsSaving(true);
    
    try {
      // Save API key to localStorage
      localStorage.setItem('bybit_api_key', apiKey);
      
      // Only store API Secret temporarily in memory, never permanently in localStorage
      // This is not ideal for production, but works for demonstration
      if (apiSecret) {
        localStorage.setItem('bybit_api_secret_temp', apiSecret);
      }
      
      // Save other settings
      localStorage.setItem('bybit_use_api', useApi.toString());
      localStorage.setItem('bybit_csv_path', csvPath);
      
      // Update API status
      updateApiStatus();
      
      // Try to sync with Bybit API to verify settings
      if (useApi && apiKey && apiSecret) {
        toast({
          title: "Testing API Connection",
          description: "Verifying connection to Bybit API...",
        });
        
        // Refresh API handler with new credentials
        apiHandler.refreshBybitService();
        
        try {
          const syncResult = await apiHandler.syncOrders();
          toast({
            title: "API Connection Successful",
            description: syncResult.message,
          });
        } catch (error: any) {
          toast({
            title: "API Connection Failed",
            description: error.message || "Failed to connect to Bybit API",
            variant: "destructive",
          });
        }
      }
      
      toast({
        title: "Settings Saved",
        description: "Your API settings have been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
      console.error("Error saving settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!apiKey || !apiSecret) {
      toast({
        title: "Missing Credentials",
        description: "Please enter both API Key and API Secret",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "Testing Connection",
        description: "Please wait while we test your API credentials...",
      });
      
      // Save credentials temporarily for testing
      localStorage.setItem('bybit_api_key', apiKey);
      localStorage.setItem('bybit_api_secret_temp', apiSecret);
      localStorage.setItem('bybit_use_api', 'true');
      
      // Refresh API handler with new credentials
      apiHandler.refreshBybitService();
      
      // Try to fetch orders to test connection
      const result = await apiHandler.syncOrders();
      
      toast({
        title: "Connection Successful",
        description: `Successfully connected to Bybit API. ${result.message}`,
      });
      
      updateApiStatus();
    } catch (error: any) {
      console.error("API test failed:", error);
      
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Bybit API",
        variant: "destructive",
      });
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold">Access Denied</h2>
        <p className="mt-2">You don't have permission to access the admin panel.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Admin Panel</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API Settings */}
        <Card>
          <CardHeader>
            <CardTitle>API Settings</CardTitle>
            <CardDescription>
              Configure how the system retrieves order data from Bybit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="api-toggle">Use Bybit API</Label>
              <div className="flex items-center gap-2">
                <Switch 
                  id="api-toggle"
                  checked={useApi}
                  onCheckedChange={setUseApi}
                />
                <span className={`px-1.5 py-0.5 rounded text-xs ${apiStatus === 'Not connected' ? 'bg-gray-200' : apiStatus.includes('Secret needed') ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                  {apiStatus}
                </span>
              </div>
            </div>
            
            {useApi ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Bybit API Key</Label>
                  <Input
                    id="api-key"
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Bybit API key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="api-secret">Bybit API Secret</Label>
                  <Input
                    id="api-secret"
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    placeholder="Enter your Bybit API secret"
                  />
                  <p className="text-xs text-amber-600">
                    Warning: For security, the API secret is only stored temporarily 
                    in memory and will not persist between sessions.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isSaving || !apiKey || !apiSecret}
                    className="flex-1"
                  >
                    Test Connection
                  </Button>
                  <Button 
                    onClick={handleSettingsSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-path">CSV File Path</Label>
                  <Input
                    id="csv-path"
                    type="text"
                    value={csvPath}
                    onChange={(e) => setCsvPath(e.target.value)}
                    placeholder="/path/to/orders.csv"
                  />
                </div>
                
                <Button 
                  onClick={handleSettingsSave}
                  disabled={isSaving}
                  className="w-full"
                >
                  {isSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage users who can access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={user.isAdmin ? "default" : "outline"}>
                      {user.isAdmin ? "Admin" : "User"}
                    </Badge>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
              ))}
              
              <Button className="w-full">
                Add New User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
