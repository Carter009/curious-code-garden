
import { Order, OrdersResponse, FilterParams } from '@/types/models';
import { apiHandler } from '@/server/api';

export class ApiService {
  // Helper method to get API credentials
  private static getApiCredentials(): { useApi: boolean; apiKey: string | null } {
    const useApi = localStorage.getItem('bybit_use_api') === 'true';
    const apiKey = localStorage.getItem('bybit_api_key');
    return { useApi, apiKey };
  }

  // Helper to convert Bybit timestamp to ISO date
  private static convertTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString();
  }

  static async getOrders(filters: FilterParams): Promise<OrdersResponse> {
    // Get API credentials to check if we can use the API
    const { useApi, apiKey } = ApiService.getApiCredentials();
    console.log(`Using Bybit API: ${useApi ? 'Yes' : 'No'}, API Key available: ${apiKey ? 'Yes' : 'No'}`);
    
    try {
      // Use the API handler to get orders
      return await apiHandler.getOrders(filters);
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }

  static async getOrderDetails(orderId: string): Promise<Order> {
    // Get API credentials to log status
    const { useApi, apiKey } = ApiService.getApiCredentials();
    console.log(`Fetching order ${orderId} details. Using Bybit API: ${useApi ? 'Yes' : 'No'}`);
    
    try {
      // Use the API handler to get order details
      return await apiHandler.getOrderDetails(orderId);
    } catch (error) {
      console.error(`Error fetching order ${orderId} details:`, error);
      throw error;
    }
  }

  static async updateOrder(orderId: string, data: { reconciled?: boolean; notes?: string }): Promise<Order> {
    try {
      // Use the API handler to update the order
      return await apiHandler.updateOrder(orderId, data);
    } catch (error) {
      console.error(`Error updating order ${orderId}:`, error);
      throw error;
    }
  }

  static async syncOrders(): Promise<{ message: string; new_orders: number }> {
    // Get API credentials to log status
    const { useApi, apiKey } = ApiService.getApiCredentials();
    console.log(`Syncing orders. Using Bybit API: ${useApi ? 'Yes' : 'No'}, API Key available: ${apiKey ? 'Yes' : 'No'}`);
    
    try {
      // Use the API handler to sync orders
      return await apiHandler.syncOrders();
    } catch (error) {
      console.error('Error syncing orders:', error);
      throw error;
    }
  }

  static async importOrders(orders: Order[]): Promise<{ message: string; imported_orders: number }> {
    try {
      // Use the API handler to import orders
      return await apiHandler.importOrders(orders);
    } catch (error) {
      console.error('Error importing orders:', error);
      throw error;
    }
  }
}
