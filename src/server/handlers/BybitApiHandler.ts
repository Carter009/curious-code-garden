
/**
 * BybitApiHandler - Handles secure interactions with the Bybit API
 */
import axios, { AxiosError } from 'axios';
import CryptoJS from 'crypto-js';
import { Order } from '@/types/models';
import { STATUS_MAP } from '@/server/bybitService';

// Bybit API endpoints
const BASE_URL = 'https://api.bybit.com';
const P2P_ORDER_URL = '/v5/p2p/order';
const P2P_ORDER_DETAILS_URL = '/v5/p2p/order-detail';

export class BybitApiHandler {
  private apiKey: string;
  private apiSecret: string;
  private testnet: boolean;
  
  constructor(apiKey: string, apiSecret: string, testnet: boolean = false) {
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.testnet = testnet;

    if (!this.apiKey || !this.apiSecret) {
      throw new Error('API key and secret are required');
    }
  }

  // Get API base URL based on testnet setting
  private getBaseUrl(): string {
    return this.testnet ? 'https://api-testnet.bybit.com' : BASE_URL;
  }

  // Create headers with authentication
  private createHeaders(timestamp: number, signature: string): Record<string, string> {
    return {
      'X-BAPI-API-KEY': this.apiKey,
      'X-BAPI-TIMESTAMP': timestamp.toString(),
      'X-BAPI-SIGN': signature,
      'X-BAPI-RECV-WINDOW': '5000',
      'Content-Type': 'application/json',
    };
  }
  
  // Generate signature for Bybit API authentication
  private generateSignature(timestamp: number, params: any = {}): string {
    // Concatenate parameters for signature
    const queryString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    // Create signature string: timestamp + apiKey + recv_window + queryString
    const signatureString = timestamp + this.apiKey + '5000' + queryString;
    
    // Generate HMAC signature using API secret
    return CryptoJS.HmacSHA256(signatureString, this.apiSecret).toString(CryptoJS.enc.Hex);
  }

  // Retry logic function for API calls
  private async withRetry<T>(
    fn: () => Promise<T>, 
    retries: number = 3, 
    delay: number = 5000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 0) {
        throw error;
      }
      console.log(`Retrying... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return this.withRetry(fn, retries - 1, delay);
    }
  }

  // Get P2P orders with pagination
  async getOrders(page: number = 1, size: number = 20): Promise<any> {
    const timestamp = Date.now();
    const params = { page, size };

    const signature = this.generateSignature(timestamp, params);
    const headers = this.createHeaders(timestamp, signature);

    return this.withRetry(async () => {
      try {
        const response = await axios.get(`${this.getBaseUrl()}${P2P_ORDER_URL}`, {
          headers,
          params,
        });

        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching orders:', axiosError.response?.data || axiosError.message);
        throw error;
      }
    });
  }

  // Get order details by order ID
  async getOrderDetails(orderId: string): Promise<any> {
    const timestamp = Date.now();
    const params = { orderId };

    const signature = this.generateSignature(timestamp, params);
    const headers = this.createHeaders(timestamp, signature);

    return this.withRetry(async () => {
      try {
        const response = await axios.get(`${this.getBaseUrl()}${P2P_ORDER_DETAILS_URL}`, {
          headers,
          params,
        });

        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError;
        console.error('Error fetching order details:', axiosError.response?.data || axiosError.message);
        throw error;
      }
    });
  }

  // Helper to convert timestamp to ISO date
  private convertTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toISOString();
  }

  // Convert Bybit order to our Order model
  mapBybitOrderToOrderModel(bybitOrder: any): Order {
    const statusCode = bybitOrder.status || -1;
    
    return {
      id: bybitOrder.id,
      order_id: bybitOrder.id,
      side: bybitOrder.side === 0 ? 'BUY' : 'SELL',
      status: STATUS_MAP[statusCode] || `Unknown (${statusCode})`,
      token_id: bybitOrder.tokenId || '',
      price: bybitOrder.price || '',
      notify_token_quantity: bybitOrder.notifyTokenQuantity || '',
      target_nickname: bybitOrder.targetNickName || '',
      create_date: bybitOrder.createDate 
        ? this.convertTimestamp(parseInt(bybitOrder.createDate))
        : new Date().toISOString(),
      seller_real_name: bybitOrder.sellerRealName || '',
      buyer_real_name: bybitOrder.buyerRealName || '',
      amount: bybitOrder.amount || '',
      reconciled: false,
      reconciled_by: undefined,
      reconciled_at: undefined,
      notes: undefined,
    };
  }
}
