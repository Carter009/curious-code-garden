
import React from 'react';
import { Button } from '@/components/ui/button';
import { FilterX, Download, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ActionButtonsProps {
  onReset: () => void;
  onExport: () => void;
  onSync?: () => void;
  isAdmin: boolean;
  isSyncing: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onReset, 
  onExport, 
  onSync, 
  isAdmin, 
  isSyncing 
}) => {
  const handleSync = () => {
    // Check API configuration before syncing
    const useApi = localStorage.getItem('bybit_use_api') === 'true';
    const apiKey = localStorage.getItem('bybit_api_key');
    const apiSecret = localStorage.getItem('bybit_api_secret_temp');
    
    if (!useApi || !apiKey || !apiSecret) {
      toast({
        title: "API Configuration Required",
        description: "Please configure your API settings in the Admin panel before syncing.",
        variant: "destructive",
      });
      return;
    }
    
    // If API is configured, proceed with sync
    if (onSync) {
      onSync();
    }
  };
  
  return (
    <div className="flex justify-between pt-2">
      <div className="space-x-2">
        <Button variant="outline" onClick={onReset}>
          <FilterX className="mr-1 h-4 w-4" />
          Reset Filters
        </Button>
        <Button variant="outline" onClick={onExport}>
          <Download className="mr-1 h-4 w-4" />
          Export CSV
        </Button>
      </div>
      
      {isAdmin && (
        <Button 
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Orders'}
        </Button>
      )}
    </div>
  );
};
