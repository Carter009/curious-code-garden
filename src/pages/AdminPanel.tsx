
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

const AdminPanel = () => {
  const { user } = useAuth();
  
  // API settings with secure storage approach
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [useApi, setUseApi] = useState(true);
  const [csvPath, setCsvPath] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
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
  }, []);
  
  // Mock users for admin
  const [users] = useState([
    { id: '1', email: 'admin@example.com', name: 'Admin User', isAdmin: true },
    { id: '2', email: 'user@example.com', name: 'Regular User', isAdmin: false },
    { id: '3', email: 'user2@example.com', name: 'Another User', isAdmin: false },
  ]);

  const handleSettingsSave = () => {
    setIsSaving(true);
    
    try {
      // Save API key to localStorage
      localStorage.setItem('bybit_api_key', apiKey);
      
      // Only store API Secret temporarily in memory, never in localStorage
      // In a real app, this would be sent to a secure backend 
      // and never stored in the browser
      
      // Save other settings
      localStorage.setItem('bybit_use_api', useApi.toString());
      localStorage.setItem('bybit_csv_path', csvPath);
      
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
              <Switch 
                id="api-toggle"
                checked={useApi}
                onCheckedChange={setUseApi}
              />
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
              </div>
            ) : (
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
            )}
            
            <Button 
              onClick={handleSettingsSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
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
