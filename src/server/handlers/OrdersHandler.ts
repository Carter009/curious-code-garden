
/**
 * OrdersHandler - Handles order-related operations
 */
import { Order, OrdersResponse, FilterParams } from '@/types/models';
import { BybitApiHandler } from '@/server/handlers/BybitApiHandler';

// In-memory store for orders - would be replaced by a database in production
const orderStore: Map<string, Order> = new Map();

export class OrdersHandler {
  // Get orders with filtering and pagination
  async getOrders(bybitHandler: BybitApiHandler | null, filters: FilterParams): Promise<OrdersResponse> {
    try {
      if (!bybitHandler) {
        return this.getMockOrders(filters);
      }

      console.log('Fetching orders from Bybit API with filters:', filters);
      const page = filters.page || 1;
      const perPage = filters.per_page || 10;
      
      // Call Bybit API to get orders
      const response = await bybitHandler.getOrders(page, perPage);
      
      if (response.ret_code !== 0) {
        console.error('Bybit API returned error:', response.ret_msg);
        throw new Error(response.ret_msg);
      }
      
      const items = response.result.items || [];
      const total = response.result.total || 0;
      
      // Get detailed information for each order
      const orderPromises = items.map(async (item: any) => {
        try {
          const detailResponse = await bybitHandler.getOrderDetails(item.id);
          if (detailResponse.ret_code !== 0) {
            throw new Error(detailResponse.ret_msg);
          }
          
          // Map the raw Bybit order to our Order model
          const order = bybitHandler.mapBybitOrderToOrderModel(detailResponse.result);
          
          // Check if we have any local data for this order (like reconciliation status)
          const localOrder = orderStore.get(order.id);
          if (localOrder) {
            return {
              ...order,
              reconciled: localOrder.reconciled,
              reconciled_by: localOrder.reconciled_by,
              reconciled_at: localOrder.reconciled_at,
              notes: localOrder.notes,
            };
          }
          
          return order;
        } catch (error) {
          console.error(`Error fetching details for order ${item.id}:`, error);
          // Fall back to mapping the list item
          return bybitHandler.mapBybitOrderToOrderModel(item);
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
  async getOrderDetails(bybitHandler: BybitApiHandler | null, orderId: string): Promise<Order> {
    try {
      if (!bybitHandler) {
        return this.getMockOrderDetails(orderId);
      }
      
      console.log(`Fetching order ${orderId} details from Bybit API`);
      const response = await bybitHandler.getOrderDetails(orderId);
      
      if (response.ret_code !== 0) {
        console.error('Bybit API returned error:', response.ret_msg);
        throw new Error(response.ret_msg);
      }
      
      // Map the raw Bybit order to our Order model
      const order = bybitHandler.mapBybitOrderToOrderModel(response.result);
      
      // Check if we have any local data for this order (like reconciliation status)
      const localOrder = orderStore.get(orderId);
      if (localOrder) {
        return {
          ...order,
          reconciled: localOrder.reconciled,
          reconciled_by: localOrder.reconciled_by,
          reconciled_at: localOrder.reconciled_at,
          notes: localOrder.notes,
        };
      }
      
      return order;
    } catch (error) {
      console.error(`Error fetching order ${orderId} details:`, error);
      // Fallback to mock data if API fails
      return this.getMockOrderDetails(orderId);
    }
  }
  
  // Update order (reconciliation, notes)
  async updateOrder(orderId: string, data: { reconciled?: boolean; notes?: string }): Promise<Order> {
    // Get current order from store or create a new one
    let order = orderStore.get(orderId) || { 
      id: orderId,
      order_id: orderId,
      // Default values for required fields if creating a new order
      side: 'BUY',
      status: 'Unknown',
      token_id: '',
      price: '',
      notify_token_quantity: '',
      target_nickname: '',
      create_date: new Date().toISOString(),
      seller_real_name: '',
      buyer_real_name: '',
      amount: '',
      reconciled: false
    };
    
    // Update the order with new data
    const updatedOrder = {
      ...order,
      reconciled: data.reconciled !== undefined ? data.reconciled : order.reconciled,
      notes: data.notes !== undefined ? data.notes : order.notes,
      reconciled_by: data.reconciled ? '1' : order.reconciled_by,
      reconciled_at: data.reconciled ? new Date().toISOString() : order.reconciled_at,
    };
    
    // Store the updated order
    orderStore.set(orderId, updatedOrder);
    console.log(`Updated order ${orderId} in local store`);
    
    return updatedOrder;
  }
  
  // Import orders from CSV or other sources
  async importOrders(orders: Order[]): Promise<{ message: string; imported_orders: number }> {
    // Store imported orders in our local store
    orders.forEach(order => {
      // Don't override existing local data for orders we already have
      const existingOrder = orderStore.get(order.id);
      if (existingOrder) {
        orderStore.set(order.id, {
          ...order,
          reconciled: existingOrder.reconciled,
          reconciled_by: existingOrder.reconciled_by,
          reconciled_at: existingOrder.reconciled_at,
          notes: existingOrder.notes,
        });
      } else {
        orderStore.set(order.id, order);
      }
    });
    
    console.log(`Imported ${orders.length} orders to local store`);
    
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
      // Add time component to match the full day
      const startDate = new Date(filters.start_date + 'T00:00:00');
      console.log('Filtering by start date:', startDate, filters.start_date);
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.create_date);
        return orderDate >= startDate;
      });
    }
    
    if (filters.end_date) {
      // Add time component to include the full day
      const endDate = new Date(filters.end_date + 'T23:59:59');
      console.log('Filtering by end date:', endDate, filters.end_date);
      filteredOrders = filteredOrders.filter(order => {
        const orderDate = new Date(order.create_date);
        return orderDate <= endDate;
      });
    }
    
    return filteredOrders;
  }
  
  // Generate mock orders for when API is not available
  private getMockOrders(filters: FilterParams): OrdersResponse {
    // Generate current date for today's mock orders
    const today = new Date();
    const currentDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Create some mock orders with today's date
    const mockOrders: Order[] = Array(20).fill(null).map((_, index) => {
      // For the first 5 orders, use today's date if no date filter is applied
      const isToday = index < 5;
      const daysAgo = isToday ? 0 : Math.floor(Math.random() * 30);
      const orderDate = new Date(today);
      orderDate.setDate(orderDate.getDate() - daysAgo);
      
      return {
        id: `${index + 1}`,
        order_id: `ORD-${100000 + index}`,
        side: index % 2 === 0 ? 'BUY' : 'SELL',
        status: ['Finished', 'Completed', 'Waiting for payment', 'Canceled'][Math.floor(Math.random() * 4)],
        token_id: `TKN-${200000 + index}`,
        price: `$${(Math.random() * 1000).toFixed(2)}`,
        notify_token_quantity: (Math.random() * 10).toFixed(2).toString(),
        target_nickname: `user${index}`,
        create_date: orderDate.toISOString(),
        seller_real_name: `Seller ${index}`,
        buyer_real_name: `Buyer ${index}`,
        amount: `$${(Math.random() * 5000).toFixed(2)}`,
        reconciled: Math.random() > 0.5,
        reconciled_by: Math.random() > 0.5 ? '1' : undefined,
        reconciled_at: Math.random() > 0.5 ? new Date().toISOString() : undefined,
        notes: Math.random() > 0.7 ? 'Some notes about this transaction' : undefined,
      };
    });
    
    // Check if any of these orders have locally saved data
    const locallyEnhancedOrders = mockOrders.map(order => {
      const localOrder = orderStore.get(order.id);
      if (localOrder) {
        return {
          ...order,
          reconciled: localOrder.reconciled,
          reconciled_by: localOrder.reconciled_by,
          reconciled_at: localOrder.reconciled_at,
          notes: localOrder.notes,
        };
      }
      return order;
    });
    
    let filteredOrders = this.applyFilters(locallyEnhancedOrders, filters);
    
    // Simple pagination
    const page = filters.page || 1;
    const perPage = filters.per_page || 10;
    const total = filteredOrders.length;
    const pages = Math.ceil(total / perPage);
    
    const paginatedOrders = filteredOrders.slice((page - 1) * perPage, page * perPage);
    
    console.log(`Returning ${paginatedOrders.length} mock orders for page ${page}`);
    
    return {
      orders: paginatedOrders,
      total,
      pages,
      current_page: page
    };
  }
  
  // Generate mock order details for when API is not available
  private getMockOrderDetails(orderId: string): Order {
    // Check if we have a local version of this order first
    const localOrder = orderStore.get(orderId);
    if (localOrder) {
      return localOrder;
    }
    
    // Otherwise generate a mock order
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
