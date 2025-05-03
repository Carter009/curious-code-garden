
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiService } from '@/services/ApiService';
import { Order } from '@/types/models';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [reconciled, setReconciled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      
      setLoading(true);
      try {
        const orderData = await ApiService.getOrderDetails(orderId);
        setOrder(orderData);
        setNotes(orderData.notes || '');
        setReconciled(orderData.reconciled);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch order details",
          variant: "destructive",
        });
        console.error("Error fetching order details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleSubmit = async () => {
    if (!orderId) return;
    
    setIsSubmitting(true);
    try {
      const updatedOrder = await ApiService.updateOrder(orderId, {
        notes,
        reconciled
      });
      
      setOrder(updatedOrder);
      toast({
        title: "Success",
        description: "Order has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
      console.error("Error updating order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-40" />
              <Skeleton className="h-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h2 className="text-2xl font-bold">Order not found</h2>
        <p className="mt-2">The order you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button className="mt-4" asChild>
          <Link to="/">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">Order: {order.order_id}</CardTitle>
              <CardDescription>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(order.create_date).toLocaleString()}</span>
                </div>
              </CardDescription>
            </div>
            <Badge variant={order.side === 'BUY' ? 'default' : 'outline'} className="text-sm">
              {order.side}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Order Details</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Status</dt>
                    <dd>{order.status}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Amount</dt>
                    <dd>{order.amount}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Price</dt>
                    <dd>{order.price}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Token ID</dt>
                    <dd>{order.token_id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Quantity</dt>
                    <dd>{order.notify_token_quantity}</dd>
                  </div>
                </dl>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">People</h3>
                <dl className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Target Nickname</dt>
                    <dd>{order.target_nickname}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Buyer</dt>
                    <dd>{order.buyer_real_name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Seller</dt>
                    <dd>{order.seller_real_name}</dd>
                  </div>
                </dl>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-4">Reconciliation</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="reconciled"
                    checked={reconciled}
                    onCheckedChange={(checked) => setReconciled(checked === true)}
                  />
                  <label
                    htmlFor="reconciled"
                    className="text-sm font-medium leading-none"
                  >
                    Mark as reconciled
                  </label>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="notes" className="text-sm font-medium">Notes</label>
                  <Textarea
                    id="notes"
                    placeholder="Add notes about this transaction..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
                
                {order.reconciled && (
                  <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
                    <p>
                      Reconciled by: {user?.name || "Unknown"} 
                      {order.reconciled_at && (
                        <span className="block mt-1 text-gray-500">
                          {new Date(order.reconciled_at).toLocaleString()}
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderDetail;
