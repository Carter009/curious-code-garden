
/**
 * SyncHandler - Handles synchronization operations with the Bybit API
 */
import { BybitApiHandler } from '@/server/handlers/BybitApiHandler';

export class SyncHandler {
  // Sync orders from Bybit API
  async syncOrders(bybitHandler: BybitApiHandler | null): Promise<{ message: string; new_orders: number }> {
    if (!bybitHandler) {
      return {
        message: 'API usage is disabled or API key is not configured',
        new_orders: 0
      };
    }
    
    try {
      console.log('Syncing orders from Bybit API');
      // In a real app, this would sync orders to a database
      // For now, we'll just fetch the first page of orders to verify API access
      const response = await bybitHandler.getOrders(1, 20);
      
      if (response.ret_code !== 0) {
        throw new Error(response.ret_msg);
      }
      
      const newOrdersCount = response.result.items.length;
      
      return {
        message: 'Successfully synced orders from Bybit API',
        new_orders: newOrdersCount
      };
    } catch (error: any) {
      console.error('Error syncing orders:', error);
      return {
        message: `Error syncing orders: ${error.message}`,
        new_orders: 0
      };
    }
  }
}
