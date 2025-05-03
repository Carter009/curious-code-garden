
export interface Order {
  id: string;
  order_id: string;
  side: 'BUY' | 'SELL';
  status: string;
  token_id: string;
  price: string;
  notify_token_quantity: string;
  target_nickname: string;
  create_date: string;
  seller_real_name: string;
  buyer_real_name: string;
  amount: string;
  reconciled: boolean;
  reconciled_by?: string;
  reconciled_at?: string;
  notes?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  pages: number;
  current_page: number;
}

export interface FilterParams {
  start_date?: string;
  end_date?: string;
  side?: 'BUY' | 'SELL';
  status?: string;
  search?: string;
  reconciled?: 'true' | 'false';
  page?: number;
  per_page?: number;
}
