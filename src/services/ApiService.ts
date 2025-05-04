
import { Order, OrdersResponse, FilterParams } from '@/types/models';
import { backendServer } from '@/server/index';
import { supabase } from '@/integrations/supabase/client';
import { CredentialsService } from '@/services/CredentialsService';

export class ApiService {
  static async getCredentialsFromSupabase() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user authenticated, using local credentials");
        return CredentialsService.getCredentials();
      }
      
      // Try to fetch credentials from Supabase
      const { data, error } = await supabase
        .from('api_credentials')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.log("Error fetching credentials from Supabase:", error);
        return CredentialsService.getCredentials();
      }
      
      if (!data) {
        console.log("No credentials found in Supabase, using local credentials");
        return CredentialsService.getCredentials();
      }
      
      // Update local credentials for session persistence
      CredentialsService.setCredentials({
        useApi: data.use_api,
        apiKey: data.api_key,
        apiSecret: data.api_secret
      });
      
      console.log("Using credentials from Supabase");
      // Fix the type issue by explicitly casting to the correct type
      const apiStatus = data.api_key && data.api_secret ? 'configured' : 'partial';
      return {
        useApi: data.use_api,
        apiKey: data.api_key,
        apiSecret: data.api_secret,
        apiStatus: apiStatus as "configured" | "partial" | "not_configured"
      };
    } catch (error) {
      console.error('Error accessing Supabase credentials:', error);
      return CredentialsService.getCredentials();
    }
  }

  static async getOrders(filters: FilterParams): Promise<OrdersResponse> {
    // Get API credentials from Supabase
    const credentials = await this.getCredentialsFromSupabase();
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
    // Get API credentials from Supabase
    const credentials = await this.getCredentialsFromSupabase();
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
    // Get API credentials from Supabase
    const credentials = await this.getCredentialsFromSupabase();
    console.log(`Syncing orders. Using Bybit API: ${credentials.useApi ? 'Yes' : 'No'}, API Key available: ${credentials.apiKey ? 'Yes' : 'No'}`);
    
    if (!credentials.useApi || !credentials.apiKey || !credentials.apiSecret) {
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
