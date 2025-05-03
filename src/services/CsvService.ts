
import { Order } from '@/types/models';
import { ApiService } from './ApiService';
import { toast } from '@/hooks/use-toast';

export class CsvService {
  static async parseOrdersCsv(file: File): Promise<Order[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        if (!event.target || typeof event.target.result !== 'string') {
          reject(new Error('Failed to read file'));
          return;
        }
        
        const csvContent = event.target.result;
        const orders: Order[] = [];
        
        try {
          // Parse CSV content
          const lines = csvContent.split('\n');
          const headers = lines[0].split(',').map(header => header.trim());
          
          // Process each line except header
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCsvLine(line);
            const order: any = {};
            
            // Map CSV column headers to order properties
            headers.forEach((header, index) => {
              if (values[index] !== undefined) {
                const key = this.mapHeaderToField(header);
                if (key) {
                  order[key] = values[index];
                }
              }
            });
            
            // Parse create date
            if (order.create_date) {
              try {
                const date = new Date(order.create_date);
                if (!isNaN(date.getTime())) {
                  order.create_date = date.toISOString();
                }
              } catch (e) {
                console.error('Date parsing error:', e);
              }
            }
            
            // Add default values
            order.reconciled = false;
            order.id = order.order_id;  // Use order_id as id if not present
            
            orders.push(order as Order);
          }
          
          resolve(orders);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  static async importOrdersCsv(file: File): Promise<{ success: boolean; count: number }> {
    try {
      const orders = await this.parseOrdersCsv(file);
      
      if (orders.length === 0) {
        throw new Error('No valid orders found in CSV');
      }
      
      // Here we would normally send the parsed orders to the server
      // For demo, we'll just update our local state/mock API
      const result = await ApiService.importOrders(orders);
      
      return { success: true, count: orders.length };
    } catch (error) {
      console.error('CSV import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CSV file",
        variant: "destructive",
      });
      return { success: false, count: 0 };
    }
  }
  
  // Helper method to parse CSV line considering quoted fields
  private static parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
  
  // Helper method to map CSV headers to model fields
  private static mapHeaderToField(header: string): string | null {
    const mapping: Record<string, string> = {
      'Order ID': 'order_id',
      'Side': 'side',
      'Status': 'status',
      'Token ID': 'token_id',
      'Price': 'price',
      'Notify Token Quantity': 'notify_token_quantity',
      'Target Nickname': 'target_nickname',
      'Create Date': 'create_date',
      'Seller Real Name': 'seller_real_name',
      'Buyer Real Name': 'buyer_real_name',
      'Amount': 'amount',
    };
    
    return mapping[header] || null;
  }
}
