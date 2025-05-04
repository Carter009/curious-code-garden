
import axios, { AxiosError } from 'axios';
import CryptoJS from 'crypto-js';

// Bybit API endpoints
const BASE_URL = 'https://api.bybit.com';
const P2P_ORDER_URL = '/v5/p2p/order';
const P2P_ORDER_DETAILS_URL = '/v5/p2p/order-detail';

// Status mapping for Bybit API responses - same as in the Python script
const STATUS_MAP: Record<number, string> = {
  5: "Waiting for chain",
  10: "Waiting for buyer to pay",
  20: "Waiting for seller to release",
  30: "Appealing",
  40: "Order canceled",
  50: "Order finished",
  60: "Paying (online)",
  70: "Pay failed (online)",
  80: "Exception canceled (hotswap)",
  90: "Waiting for buyer to select tokenId",
  100: "Objectioning",
  110: "Waiting for user to raise objection"
};

// Helper to convert timestamp to ISO date
const convertTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString();
};

// Generate signature for Bybit API authentication using crypto-js instead of Node's crypto
const generateSignature = (apiKey: string, apiSecret: string, timestamp: number, params: any = {}): string => {
  // Concatenate parameters for signature
  const queryString = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  // Create signature string: timestamp + apiKey + recv_window + queryString
  const signatureString = timestamp + apiKey + '5000' + queryString;
  
  // Generate HMAC signature using API secret with CryptoJS
  return CryptoJS.HmacSHA256(signatureString, apiSecret).toString(CryptoJS.enc.Hex);
};

// Retry logic function
const withRetry = async <T>(
  fn: () => Promise<T>, 
  retries: number = 3, 
  delay: number = 5000
): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw error;
    }
    console.log(`Retrying... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay);
  }
};

// Bybit P2P API service
export class BybitP2PService {
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

  // Get P2P orders with pagination
  async getOrders(page: number = 1, size: number = 20): Promise<any> {
    const timestamp = Date.now();
    const params = { page, size };

    const signature = generateSignature(this.apiKey, this.apiSecret, timestamp, params);
    const headers = this.createHeaders(timestamp, signature);

    return withRetry(async () => {
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

    const signature = generateSignature(this.apiKey, this.apiSecret, timestamp, params);
    const headers = this.createHeaders(timestamp, signature);

    return withRetry(async () => {
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

  // Convert Bybit order to our Order model
  mapBybitOrderToOrderModel(bybitOrder: any): any {
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
        ? convertTimestamp(parseInt(bybitOrder.createDate))
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

export const getBybitService = (): BybitP2PService | null => {
  // In a real production environment, these would be securely stored
  // For now, we're getting them from localStorage (not ideal for production)
  const useApi = localStorage.getItem('bybit_use_api') === 'true';
  const apiKey = localStorage.getItem('bybit_api_key');
  const apiSecret = localStorage.getItem('bybit_api_secret_temp'); // This is temporary
  
  if (useApi && apiKey && apiSecret) {
    try {
      return new BybitP2PService(apiKey, apiSecret);
    } catch (error) {
      console.error('Failed to initialize Bybit service:', error);
      return null;
    }
  }
  
  return null;
};

export { STATUS_MAP };
