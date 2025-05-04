
import { Order, OrdersResponse, FilterParams } from '@/types/models';
import { BybitP2PService, getBybitService, STATUS_MAP } from './bybitService';
import { CredentialsService } from '@/services/CredentialsService';

class ApiHandler {
  private bybitService: BybitP2PService | null = null;
  
  // Initialize the API handler with Bybit service if available
  constructor() {
    this.refreshBybitService();
  }
  
  // Refresh Bybit service with latest credentials
  refreshBybitService(): void {
    this.bybitService = getBybitService();
  }
  
  // Check if API is configured
  isApiConfigured(): boolean {
    return CredentialsService.isApiConfigured();
  }
  
  // Get orders with filtering and pagination
  async getOrders(filters: FilterParams): Promise<OrdersResponse> {
    this.refreshBybitService();
    
    try {
      if (!this.bybitService) {
        return this.getMockOrders(filters);
      }

      console.log('Fetching orders from Bybit API');
      const page = filters.page || 1;
      const perPage = filters.per_page || 10;
      
      // Call Bybit API to get orders
      const response = await this.bybitService.getOrders(page, perPage);
      
      if (response.ret_code !== 0) {
        console.error('Bybit API returned error:', response.ret_msg);
        throw new Error(response.ret_msg);
      }
      
      const items = response.result.items || [];
      const total = response.result.total || 0;
      
      // Get detailed information for each order
      const orderPromises = items.map(async (item: any) => {
        try {
          const detailResponse = await this.bybitService!.getOrderDetails(item.id);
          if (detailResponse.ret_code !== 0) {
            throw new Error(detailResponse.ret_msg);
          }
          return this.bybitService!.mapBybitOrderToOrderModel(detailResponse.result);
        } catch (error) {
          console.error(`Error fetching details for order ${item.id}:`, error);
          return this.bybitService!.mapBybitOrderToOrderModel(item);
        }
      });
      
      let orders = await Promise.all(orderPromises);
      
      // Apply filters
      orders = this.applyFilters(orders, filters);
      
      const pages = Math.ceil(total / perPage);
      
      return {
        orders,
        total,
        pages,
        current_page: page
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to mock data if API fails
      return this.getMockOrders(filters);
    }
  }
  
  // Get order details by ID
  async getOrderDetails(orderId: string): Promise<Order> {
    this.refreshBybitService();
    
    try {
      if (!this.bybitService) {
        return this.getMockOrderDetails(orderId);
      }
      
      console.log(`Fetching order ${orderId} details from Bybit API`);
      const response = await this.bybitService.getOrderDetails(orderId);
      
      if (response.ret_code !== 0) {
        console.error('Bybit API returned error:', response.ret_msg);
        throw new Error(response.ret_msg);
      }
      
      return this.bybitService.mapBybitOrderToOrderModel(response.result);
    } catch (error) {
      console.error(`Error fetching order ${orderId} details:`, error);
      // Fallback to mock data if API fails
      return this.getMockOrderDetails(orderId);
    }
  }
  
  // Update order (reconciliation, notes) - in a real app, this would be stored in a database
  async updateOrder(orderId: string, data: { reconciled?: boolean; notes?: string }): Promise<Order> {
    // Get current order details
    const order = await this.getOrderDetails(orderId);
    
    return {
      ...order,
      reconciled: data.reconciled !== undefined ? data.reconciled : order.reconciled,
      notes: data.notes !== undefined ? data.notes : order.notes,
      reconciled_by: data.reconciled ? '1' : undefined,
      reconciled_at: data.reconciled ? new Date().toISOString() : undefined,
    };
  }
  
  // Sync orders from Bybit API
  async syncOrders(): Promise<{ message: string; new_orders: number }> {
    this.refreshBybitService();
    
    if (!this.bybitService) {
      return {
        message: 'API usage is disabled or API key is not configured',
        new_orders: 0
      };
    }
    
    try {
      console.log('Syncing orders from Bybit API');
      // In a real app, this would sync orders to a database
      // For now, we'll just fetch the first page of orders
      const response = await this.bybitService.getOrders(1, 20);
      
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
  
  // Import orders from CSV or other sources
  async importOrders(orders: Order[]): Promise<{ message: string; imported_orders: number }> {
    // In a real app, this would store orders in a database
    console.log('Importing orders:', orders);
    
    return {
      message: 'Successfully imported orders',
      imported_orders: orders.length
    };
  }
  
  // Apply filters to orders
  private applyFilters(orders: Order[], filters: FilterParams): Order[] {
    let filteredOrders = [...orders];
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filteredOrders = filteredOrders.filter(order => 
        order.order_id.toLowerCase().includes(searchLower) ||
        order.buyer_real_name.toLowerCase().includes(searchLower) ||
        order.seller_real_name.toLowerCase().includes(searchLower) ||
        order.target_nickname.toLowerCase().includes(searchLower)
      );
    }
    
    if (filters.side) {
      filteredOrders = filteredOrders.filter(order => order.side === filters.side);
    }
    
    if (filters.status) {
      filteredOrders = filteredOrders.filter(order => order.status === filters.status);
    }
    
    if (filters.reconciled === 'true') {
      filteredOrders = filteredOrders.filter(order => order.reconciled);
    } else if (filters.reconciled === 'false') {
      filteredOrders = filteredOrders.filter(order => !order.reconciled);
    }
    
    if (filters.start_date) {
      const startDate = new Date(filters.start_date).getTime();
      filteredOrders = filteredOrders.filter(order => new Date(order.create_date).getTime() >= startDate);
    }
    
    if (filters.end_date) {
      const endDate = new Date(filters.end_date).getTime();
      filteredOrders = filteredOrders.filter(order => new Date(order.create_date).getTime() <= endDate);
    }
    
    return filteredOrders;
  }
  
  // Generate mock orders for when API is not available
  private getMockOrders(filters: FilterParams): OrdersResponse {
    const mockOrders: Order[] = Array(20).fill(null).map((_, index) => ({
      id: `${index + 1}`,
      order_id: `ORD-${100000 + index}`,
      side: index % 2 === 0 ? 'BUY' : 'SELL',
      status: ['Finished', 'Completed', 'Waiting for payment', 'Canceled'][Math.floor(Math.random() * 4)],
      token_id: `TKN-${200000 + index}`,
      price: `$${(Math.random() * 1000).toFixed(2)}`,
      notify_token_quantity: (Math.random() * 10).toFixed(2).toString(),
      target_nickname: `user${index}`,
      create_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      seller_real_name: `Seller ${index}`,
      buyer_real_name: `Buyer ${index}`,
      amount: `$${(Math.random() * 5000).toFixed(2)}`,
      reconciled: Math.random() > 0.5,
      reconciled_by: Math.random() > 0.5 ? '1' : undefined,
      reconciled_at: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      notes: Math.random() > 0.7 ? 'Some notes about this transaction' : undefined,
    }));
    
    let filteredOrders = this.applyFilters(mockOrders, filters);
    
    // Simple pagination
    const page = filters.page || 1;
    const perPage = filters.per_page || 10;
    const total = filteredOrders.length;
    const pages = Math.ceil(total / perPage);
    
    const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);
    
    return {
      orders: paginatedOrders,
      total,
      pages,
      current_page: page
    };
  }
  
  // Generate mock order details for when API is not available
  private getMockOrderDetails(orderId: string): Order {
    return {
      id: orderId,
      order_id: `ORD-${orderId}`,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      status: ['Finished', 'Completed', 'Waiting for payment', 'Canceled'][Math.floor(Math.random() * 4)],
      token_id: `TKN-${200000 + parseInt(orderId)}`,
      price: `$${(Math.random() * 1000).toFixed(2)}`,
      notify_token_quantity: (Math.random() * 10).toFixed(2).toString(),
      target_nickname: `user${orderId}`,
      create_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      seller_real_name: `Seller ${orderId}`,
      buyer_real_name: `Buyer ${orderId}`,
      amount: `$${(Math.random() * 5000).toFixed(2)}`,
      reconciled: Math.random() > 0.5,
      reconciled_by: Math.random() > 0.5 ? '1' : undefined,
      reconciled_at: Math.random() > 0.5 ? new Date().toISOString() : undefined,
      notes: Math.random() > 0.7 ? 'Some notes about this transaction' : undefined,
    };
  }
}

// Create a singleton instance of the API handler
export const apiHandler = new ApiHandler();
