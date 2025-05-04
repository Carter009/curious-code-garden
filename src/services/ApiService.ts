
import { Order, OrdersResponse, FilterParams } from '@/types/models';
import { backendServer } from '@/server/index';
import { CredentialsService } from '@/services/CredentialsService';

export class ApiService {
  static async getOrders(filters: FilterParams): Promise<OrdersResponse> {
    // Get API credentials to check if we can use the API
    const credentials = CredentialsService.getCredentials();
    console.log(`Using Bybit API: ${credentials.useApi ? 'Yes' : 'No'}, API Key available: ${credentials.apiKey ? 'Yes' : 'No'}`);
    
    // Initialize the backend server with current credentials
    backendServer.initializeBybitHandler(credentials);
    
    try {
      // Use the backend server to get orders
      return await backendServer.getOrders(filters);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  static async getOrderDetails(orderId: string): Promise<Order> {
    // Get API credentials to log status
    const credentials = CredentialsService.getCredentials();
    console.log(`Fetching order ${orderId} details. Using Bybit API: ${credentials.useApi ? 'Yes' : 'No'}`);
    
    // Initialize the backend server with current credentials
    backendServer.initializeBybitHandler(credentials);
    
    try {
      // Use the backend server to get order details
      return await backendServer.getOrderDetails(orderId);
    } catch (error) {
      console.error(`Error fetching order ${orderId} details:`, error);
      throw error;
    }
  }

  static async updateOrder(orderId: string, data: { reconciled?: boolean; notes?: string }): Promise<Order> {
    try {
      // Use the backend server to update the order
      return await backendServer.updateOrder(orderId, data);
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      throw error;
    }
  }

  static async syncOrders(): Promise<{ message: string; new_orders: number }> {
    // Get API credentials to log status
    const credentials = CredentialsService.getCredentials();
    console.log(`Syncing orders. Using Bybit API: ${credentials.useApi ? 'Yes' : 'No'}, API Key available: ${credentials.apiKey ? 'Yes' : 'No'}`);
    
    if (!CredentialsService.isApiConfigured()) {
      throw new Error('API usage is disabled or API key is not configured');
    }
    
    // Initialize the backend server with current credentials
    backendServer.initializeBybitHandler(credentials);
    
    try {
      // Use the backend server to sync orders
      return await backendServer.syncOrders();
    } catch (error) {
      console.error('Error syncing orders:', error);
      throw error;
    }
  }

  static async importOrders(orders: Order[]): Promise<{ message: string; imported_orders: number }> {
    try {
      // Use the backend server to import orders
      return await backendServer.importOrders(orders);
    } catch (error) {
      console.error('Error importing orders:', error);
      throw error;
    }
  }
}
