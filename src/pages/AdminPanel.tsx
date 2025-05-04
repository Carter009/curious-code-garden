
import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { apiHandler } from '@/server/api';
import { CredentialsService, ApiCredentials } from '@/services/CredentialsService';

const AdminPanel = () => {
  const { user, isAdmin } = useSupabaseAuth();
  
  // API settings with secure storage approach
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [useApi, setUseApi] = useState(true);
  const [csvPath, setCsvPath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState<ApiCredentials['apiStatus']>('not_configured');
  
  // Load saved API settings on component mount
  useEffect(() => {
    const credentials = CredentialsService.getCredentials();
    
    if (credentials.apiKey) {
      setApiKey(credentials.apiKey);
    }
    
    setUseApi(credentials.useApi);
    setApiStatus(credentials.apiStatus);
    
    const savedCsvPath = localStorage.getItem('bybit_csv_path');
    if (savedCsvPath) {
      setCsvPath(savedCsvPath);
    }
  }, []);
  
  // Mock users for admin
  const [users] = useState([
    { id: '1', email: 'admin@example.com', name: 'Admin User', isAdmin: true },
    { id: '2', email: 'user@example.com', name: 'Regular User', isAdmin: false },
    { id: '3', email: 'user2@example.com', name: 'Another User', isAdmin: false },
  ]);

  const handleSettingsSave = async () => {
    setIsSaving(true);
    
    try {
      // Save settings using the credentials service
      const updatedCredentials = CredentialsService.setCredentials({
        useApi,
        apiKey,
        apiSecret: apiSecret || undefined
      });
      
      // Update local state with the new credentials
      setApiStatus(updatedCredentials.apiStatus);
      
      // Save other settings
      localStorage.setItem('bybit_csv_path', csvPath);
      
      // Try to sync with Bybit API to verify settings
      if (updatedCredentials.apiStatus === 'configured') {
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
      CredentialsService.setCredentials({
        useApi: true,
        apiKey,
        apiSecret
      });
      
      // Refresh API handler with new credentials
      apiHandler.refreshBybitService();
      
      // Try to fetch orders to test connection
      const result = await apiHandler.syncOrders();
      
      toast({
        title: "Connection Successful",
        description: `Successfully connected to Bybit API. ${result.message}`,
      });
      
      // Update API status
      const credentials = CredentialsService.getCredentials();
      setApiStatus(credentials.apiStatus);
    } catch (error: any) {
      console.error("API test failed:", error);
      
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Bybit API",
        variant: "destructive",
      });
    }
  };

  const getApiStatusDisplay = () => {
    switch (apiStatus) {
      case 'configured':
        return { text: 'API Key configured', className: 'bg-green-100 text-green-800' };
      case 'partial':
        return { text: 'API Key saved (Secret needed)', className: 'bg-amber-100 text-amber-800' };
      case 'not_configured':
      default:
        return { text: 'Not connected', className: 'bg-gray-200' };
    }
  };
  
  const statusDisplay = getApiStatusDisplay();

  // Use the isAdmin value from context rather than trying to access it on user object
  if (!isAdmin) {
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
                <span className={`px-1.5 py-0.5 rounded text-xs ${statusDisplay.className}`}>
                  {statusDisplay.text}
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
