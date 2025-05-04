
import { supabase } from '@/integrations/supabase/client';
import { Order, OrdersResponse, FilterParams } from '@/types/models';
import { CredentialsService } from '@/services/CredentialsService';

export class SupabaseService {
  // Store user API credentials
  static async storeCredentials(credentials: {
    useApi?: boolean;
    apiKey?: string;
    apiSecret?: string;
  }): Promise<void> {
    const user = supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const userId = (await user).data.user?.id;
    if (!userId) throw new Error('User ID not found');
    
    const { data: existingCredentials, error: fetchError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      throw new Error(`Error fetching credentials: ${fetchError.message}`);
    }
    
    let newData: any = {};
    
    if (credentials.useApi !== undefined) {
      newData.use_api = credentials.useApi;
    }
    
    if (credentials.apiKey !== undefined) {
      newData.api_key = credentials.apiKey;
    }
    
    if (credentials.apiSecret !== undefined) {
      newData.api_secret = credentials.apiSecret;
    }
    
    if (existingCredentials) {
      // Update existing credentials
      const { error: updateError } = await supabase
        .from('api_credentials')
        .update(newData)
        .eq('user_id', userId);
        
      if (updateError) throw new Error(`Error updating credentials: ${updateError.message}`);
    } else {
      // Insert new credentials
      newData.user_id = userId;
      
      const { error: insertError } = await supabase
        .from('api_credentials')
        .insert([newData]);
        
      if (insertError) throw new Error(`Error storing credentials: ${insertError.message}`);
    }
    
    // Update local storage for session persistence
    CredentialsService.setCredentials(credentials);
  }
  
  // Fetch user API credentials
  static async getCredentials(): Promise<{
    useApi: boolean;
    apiKey: string | null;
    apiSecret: string | null;
  }> {
    const user = supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const userId = (await user).data.user?.id;
    if (!userId) throw new Error('User ID not found');
    
    const { data, error } = await supabase
      .from('api_credentials')
      .select('use_api, api_key, api_secret')
      .eq('user_id', userId)
      .single();
      
    if (error) {
      console.error('Error fetching credentials:', error);
      return {
        useApi: false,
        apiKey: null,
        apiSecret: null
      };
    }
    
    // Update local storage for session persistence
    CredentialsService.setCredentials({
      useApi: data.use_api,
      apiKey: data.api_key,
      apiSecret: data.api_secret
    });
    
    return {
      useApi: data.use_api || false,
      apiKey: data.api_key || null,
      apiSecret: data.api_secret || null
    };
  }
  
  // Get orders with filtering and pagination
  static async getOrders(filters: FilterParams): Promise<OrdersResponse> {
    let query = supabase.from('orders').select('*', { count: 'exact' });
    
    // Apply filters
    if (filters.side) {
      query = query.eq('side', filters.side);
    }
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.reconciled === 'true') {
      query = query.eq('reconciled', true);
    } else if (filters.reconciled === 'false') {
      query = query.eq('reconciled', false);
    }
    
    if (filters.start_date) {
      query = query.gte('create_date', filters.start_date);
    }
    
    if (filters.end_date) {
      query = query.lte('create_date', filters.end_date);
    }
    
    if (filters.search) {
      query = query.or(`order_id.ilike.%${filters.search}%,buyer_real_name.ilike.%${filters.search}%,seller_real_name.ilike.%${filters.search}%,target_nickname.ilike.%${filters.search}%`);
    }
    
    // Apply pagination
    const page = filters.page || 1;
    const perPage = filters.per_page || 10;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    
    query = query.range(from, to);
    
    // Execute the query
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
    
    // If no data in database yet, return mock data
    if (!data || data.length === 0) {
      const apiService = await import('@/services/ApiService');
      return apiService.ApiService.getOrders(filters);
    }
    
    const total = count || 0;
    const pages = Math.ceil(total / perPage);
    
    return {
      orders: data as Order[],
      total,
      pages,
      current_page: page
    };
  }
  
  // Get order details by ID
  static async getOrderDetails(orderId: string): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (error) {
      // If not found in database, try from API
      if (error.code === 'PGRST116') {
        const apiService = await import('@/services/ApiService');
        return apiService.ApiService.getOrderDetails(orderId);
      }
      
      console.error(`Error fetching order ${orderId} details:`, error);
      throw error;
    }
    
    return data as Order;
  }
  
  // Update order (reconciliation, notes)
  static async updateOrder(orderId: string, updateData: { reconciled?: boolean; notes?: string }): Promise<Order> {
    // Get current user ID for reconciliation tracking
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const dataToUpdate: any = {};
    
    if (updateData.reconciled !== undefined) {
      dataToUpdate.reconciled = updateData.reconciled;
      if (updateData.reconciled) {
        dataToUpdate.reconciled_by = user.id;
        dataToUpdate.reconciled_at = new Date().toISOString();
      } else {
        dataToUpdate.reconciled_by = null;
        dataToUpdate.reconciled_at = null;
      }
    }
    
    if (updateData.notes !== undefined) {
      dataToUpdate.notes = updateData.notes;
    }
    
    const { data, error } = await supabase
      .from('orders')
      .update(dataToUpdate)
      .eq('id', orderId)
      .select()
      .single();
      
    if (error) {
      console.error(`Error updating order ${orderId}:`, error);
      throw error;
    }
    
    return data as Order;
  }
  
  // Import orders into Supabase
  static async importOrders(orders: Order[]): Promise<{ message: string; imported_orders: number }> {
    // Check if admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');
    
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
      
    if (userError || !userData || !userData.is_admin) {
      throw new Error('Only admin users can import orders');
    }
    
    // Prepare orders for insert - ensure all required fields are present
    const ordersToInsert = orders.map(order => ({
      order_id: order.order_id,
      side: order.side,
      status: order.status,
      token_id: order.token_id || '',
      price: order.price || '',
      notify_token_quantity: order.notify_token_quantity || '',
      target_nickname: order.target_nickname || '',
      create_date: order.create_date,
      seller_real_name: order.seller_real_name || '',
      buyer_real_name: order.buyer_real_name || '',
      amount: order.amount || '',
      reconciled: order.reconciled || false,
      reconciled_by: order.reconciled_by || null,
      reconciled_at: order.reconciled_at || null,
      notes: order.notes || ''
    }));
    
    // Insert orders
    const { data, error } = await supabase
      .from('orders')
      .upsert(ordersToInsert, { 
        onConflict: 'order_id',
        ignoreDuplicates: false
      });
      
    if (error) {
      console.error('Error importing orders:', error);
      throw error;
    }
    
    return {
      message: `Successfully imported ${orders.length} orders`,
      imported_orders: orders.length
    };
  }
  
  // Sync orders from external API
  static async syncOrders(): Promise<{ message: string; new_orders: number }> {
    // Get local data
    try {
      // Check credentials
      const credentials = await this.getCredentials();
      if (!credentials.useApi || !credentials.apiKey || !credentials.apiSecret) {
        throw new Error('API usage is disabled or API key is not configured');
      }
      
      // Use existing API service to fetch orders
      const apiService = await import('@/services/ApiService');
      const result = await apiService.ApiService.syncOrders();
      
      // Import the fetched orders
      if (result.new_orders > 0) {
        // In a real implementation, we would fetch and insert the new orders here
        // For now, we'll just return the result from the API service
      }
      
      return result;
    } catch (error: any) {
      console.error('Error syncing orders:', error);
      throw error;
    }
  }
}
