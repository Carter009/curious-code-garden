
import React from 'react';
import { Link } from 'react-router-dom';
import { Order } from '@/types/models';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface OrdersTableProps {
  orders: Order[];
  isLoading: boolean;
}

export const OrdersTable: React.FC<OrdersTableProps> = ({ orders, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="w-full h-16 bg-gray-100 animate-pulse rounded-md"></div>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">No orders found matching your filters</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Order ID</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead className="text-center">Reconciled</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">
                <Link to={`/orders/${order.id}`} className="text-blue-600 hover:underline">
                  {order.order_id}
                </Link>
              </TableCell>
              <TableCell>
                {new Date(order.create_date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge variant={order.side === 'BUY' ? 'default' : 'outline'}>
                  {order.side}
                </Badge>
              </TableCell>
              <TableCell>{order.status}</TableCell>
              <TableCell>{order.amount}</TableCell>
              <TableCell>{order.buyer_real_name}</TableCell>
              <TableCell>{order.seller_real_name}</TableCell>
              <TableCell className="text-center">
                <Checkbox checked={order.reconciled} disabled />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
