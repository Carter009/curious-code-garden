
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CsvService } from '@/services/CsvService';
import { toast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface CsvImporterProps {
  onImportSuccess?: (count: number) => void;
}

export const CsvImporter: React.FC<CsvImporterProps> = ({ onImportSuccess }) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
      return;
    }
    
    setIsImporting(true);
    try {
      const result = await CsvService.importOrdersCsv(file);
      if (result.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${result.count} orders from CSV`,
        });
        if (onImportSuccess) {
          onImportSuccess(result.count);
        }
      }
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button 
        onClick={handleImportClick}
        disabled={isImporting}
        variant="outline"
      >
        <Upload className="mr-2 h-4 w-4" />
        {isImporting ? "Importing..." : "Import CSV"}
      </Button>
    </div>
  );
};
