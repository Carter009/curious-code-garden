
/**
 * Backend Server Implementation
 * This file serves as the entry point for our backend server implementation
 */
import { ApiCredentials } from '@/services/CredentialsService';
import { BybitApiHandler } from '@/server/handlers/BybitApiHandler';
import { OrdersHandler } from '@/server/handlers/OrdersHandler';
import { SyncHandler } from '@/server/handlers/SyncHandler';

// Main server class that coordinates all backend operations
export class BackendServer {
  private static instance: BackendServer;
  private bybitHandler: BybitApiHandler | null = null;
  private ordersHandler: OrdersHandler;
  private syncHandler: SyncHandler;
  
  private constructor() {
    this.ordersHandler = new OrdersHandler();
    this.syncHandler = new SyncHandler();
  }
  
  // Singleton pattern to ensure only one server instance
  public static getInstance(): BackendServer {
    if (!BackendServer.instance) {
      BackendServer.instance = new BackendServer();
    }
    return BackendServer.instance;
  }
  
  // Initialize the Bybit API handler with credentials
  public initializeBybitHandler(credentials: ApiCredentials): void {
    if (credentials.useApi && credentials.apiKey && credentials.apiSecret) {
      try {
        this.bybitHandler = new BybitApiHandler(
          credentials.apiKey, 
          credentials.apiSecret
        );
        console.log('Bybit API handler initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Bybit API handler:', error);
        this.bybitHandler = null;
      }
    } else {
      this.bybitHandler = null;
    }
  }
  
  // Get orders with filtering and pagination
  public async getOrders(filters: any): Promise<any> {
    return this.ordersHandler.getOrders(this.bybitHandler, filters);
  }
  
  // Get order details by ID
  public async getOrderDetails(orderId: string): Promise<any> {
    return this.ordersHandler.getOrderDetails(this.bybitHandler, orderId);
  }
  
  // Update order details (notes, reconciliation status)
  public async updateOrder(orderId: string, data: any): Promise<any> {
    return this.ordersHandler.updateOrder(orderId, data);
  }
  
  // Sync orders from Bybit API
  public async syncOrders(): Promise<any> {
    return this.syncHandler.syncOrders(this.bybitHandler);
  }
  
  // Import orders from external sources (CSV)
  public async importOrders(orders: any[]): Promise<any> {
    return this.ordersHandler.importOrders(orders);
  }
  
  // Check if the Bybit API handler is initialized
  public isApiReady(): boolean {
    return this.bybitHandler !== null;
  }
}

// Export a singleton instance for use throughout the app
export const backendServer = BackendServer.getInstance();
