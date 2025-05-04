
import React from 'react';
import { Button } from '@/components/ui/button';
import { FilterX, Download, RefreshCw } from 'lucide-react';

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
      
      {isAdmin && onSync && (
        <Button 
          onClick={onSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`mr-1 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync Orders'}
        </Button>
      )}
    </div>
  );
};
