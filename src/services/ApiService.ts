import { Order, OrdersResponse, FilterParams } from '@/types/models';

// In a real app, this would be an environment variable
const API_BASE_URL = '/api';

export class ApiService {
  static async getOrders(filters: FilterParams): Promise<OrdersResponse> {
    // In a real application, this would make an actual API call
    // For this demo, we'll simulate the API response with mock data
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockOrders: Order[] = Array(20).fill(null).map((_, index) => ({
      id: `${index + 1}`,
      order_id: `ORD-${100000 + index}`,
      side: index % 2 === 0 ? 'BUY' : 'SELL',
      status: ['Finished', 'Completed', 'Waiting for payment', 'Canceled'][Math.floor(Math.random() * 4)],
      token_id: `TKN-${200000 + index}`,
      price: `$${(Math.random() * 1000).toFixed(2)}`,
      notify_token_quantity: (Math.random() * 10).toFixed(2),
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
    
    // Filter orders based on the provided filters
    let filteredOrders = [...mockOrders];
    
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

  static async getOrderDetails(orderId: string): Promise<Order> {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Return a mock order for demonstration
    return {
      id: orderId,
      order_id: `ORD-${orderId}`,
      side: Math.random() > 0.5 ? 'BUY' : 'SELL',
      status: ['Finished', 'Completed', 'Waiting for payment', 'Canceled'][Math.floor(Math.random() * 4)],
      token_id: `TKN-${200000 + parseInt(orderId)}`,
      price: `$${(Math.random() * 1000).toFixed(2)}`,
      notify_token_quantity: (Math.random() * 10).toFixed(2),
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

  static async updateOrder(orderId: string, data: { reconciled?: boolean; notes?: string }): Promise<Order> {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, this would return the updated order from the server
    const mockOrder = await this.getOrderDetails(orderId);
    
    return {
      ...mockOrder,
      reconciled: data.reconciled !== undefined ? data.reconciled : mockOrder.reconciled,
      notes: data.notes !== undefined ? data.notes : mockOrder.notes,
      reconciled_by: data.reconciled ? '1' : undefined,
      reconciled_at: data.reconciled ? new Date().toISOString() : undefined,
    };
  }

  static async syncOrders(): Promise<{ message: string; new_orders: number }> {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Return a mock response
    return {
      message: 'Successfully synced orders from Bybit API',
      new_orders: Math.floor(Math.random() * 20) + 1
    };
  }

  static async importOrders(orders: Order[]): Promise<{ message: string; imported_orders: number }> {
    // In a real app, this would be an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate merging with existing orders
    // In a production environment, this would send the orders to a backend API
    console.log('Importing orders:', orders);
    
    return {
      message: 'Successfully imported orders from CSV',
      imported_orders: orders.length
    };
  }
}
