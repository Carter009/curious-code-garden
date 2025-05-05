import React, { useState, useEffect } from 'react';
import { OrdersTable } from '@/components/OrdersTable';
import { FilterBar } from '@/components/FilterBar';
import { CsvImporter } from '@/components/CsvImporter';
import { ApiService } from '@/services/ApiService';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Order, FilterParams } from '@/types/models';
import { toast } from '@/hooks/use-toast';
import { format, startOfToday } from 'date-fns';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { AlertCircle, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Dashboard = () => {
  const { user, isAdmin } = useSupabaseAuth();
  const [filters, setFilters] = useState<FilterParams>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [apiStatus, setApiStatus] = useState<{
    isConnected: boolean | null;
    message: string;
  }>({
    isConnected: null,
    message: "Checking API connection...",
  });
  
  // Check API connection status
  useEffect(() => {
    const checkApiConnection = async () => {
      try {
        console.log("Checking API credentials from Supabase...");
        const credentials = await ApiService.getCredentialsFromSupabase();
        console.log("API connection check results:", credentials);
        
        if (credentials.useApi && credentials.apiKey && credentials.apiSecret) {
          console.log("API is fully configured");
          setApiStatus({
            isConnected: true,
            message: "Connected to Bybit API"
          });
        } else if (credentials.useApi && (!credentials.apiKey || !credentials.apiSecret)) {
          console.log("API is enabled but credentials are missing");
          setApiStatus({
            isConnected: false,
            message: "API enabled but credentials missing or incomplete"
          });
        } else {
          console.log("API is disabled, using demo data");
          setApiStatus({
            isConnected: false,
            message: "Using demo data (API disabled)"
          });
        }
      } catch (error) {
        console.error("Error checking API connection:", error);
        setApiStatus({
          isConnected: false,
          message: "Error checking API connection"
        });
      }
    };
    
    checkApiConnection();
  }, []);
  
  // Use React Query to fetch orders - updated to use the latest React Query v5 syntax
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['orders', filters, currentPage],
    queryFn: async () => {
      console.log("Fetching orders with filters:", filters);
      try {
        console.log("Calling ApiService.getOrders with filters:", filters);
        const result = await ApiService.getOrders({
          ...filters,
          page: currentPage,
          per_page: 10
        });
        console.log("Orders fetched successfully:", result);
        return result;
      } catch (error) {
        console.error("Error in queryFn:", error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData,
    meta: {
      onSuccess: (data: any) => {
        // Extract unique statuses for filter dropdown
        const uniqueStatuses = new Set<string>();
        data.orders.forEach((order: Order) => {
          if (order.status) uniqueStatuses.add(order.status);
        });
        setStatusOptions(Array.from(uniqueStatuses));
        
        // Display a message if no orders are found
        if (data.orders.length === 0) {
          toast({
            title: "No orders found",
            description: "Try adjusting your filters or sync with Bybit API",
            variant: "default",
          });
        }
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: "Failed to fetch orders",
          variant: "destructive",
        });
        console.error("Error fetching orders:", error);
      }
    }
  });

  // Get current values from the query result
  const orders = data?.orders || [];
  const totalOrders = data?.total || 0;
  const totalPages = data?.pages || 1;

  // Call onSuccess manually when data changes
  useEffect(() => {
    if (data) {
      const uniqueStatuses = new Set<string>();
      data.orders.forEach(order => {
        if (order.status) uniqueStatuses.add(order.status);
      });
      setStatusOptions(Array.from(uniqueStatuses));
      
      // Display a message if no orders are found
      if (data.orders.length === 0) {
        toast({
          title: "No orders found",
          description: "Try adjusting your filters or sync with Bybit API",
          variant: "default",
        });
      }
    }
  }, [data]);

  const handleFilter = (newFilters: FilterParams) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your CSV file will download shortly.",
    });
    
    // In a real app, this would trigger a file download
    setTimeout(() => {
      toast({
        title: "Export Complete",
        description: "Your CSV file has been downloaded.",
      });
    }, 2000);
  };

  // Use mutation for sync operation
  const syncMutation = useMutation({
    mutationFn: ApiService.syncOrders,
    onMutate: () => {
      setIsSyncing(true);
      toast({
        title: "Syncing",
        description: "Fetching latest orders from Bybit API...",
      });
    },
    onSuccess: (result) => {
      toast({
        title: "Sync Successful",
        description: result.message,
      });
      refetch(); // Reload orders after sync
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync orders from Bybit",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSyncing(false);
    }
  });

  const handleSync = () => {
    syncMutation.mutate();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCsvImportSuccess = (count: number) => {
    toast({
      title: "CSV Import Complete",
      description: `Successfully imported ${count} orders from CSV`,
    });
    refetch(); // Refresh the orders list
  };

  // Filter orders for today
  const filterToday = () => {
    const today = startOfToday();
    const formattedToday = format(today, 'yyyy-MM-dd');
    
    setFilters(prev => ({
      ...prev,
      start_date: formattedToday,
      end_date: formattedToday
    }));
    
    toast({
      title: "Today's Orders",
      description: `Showing orders for ${format(today, 'MMMM d, yyyy')}`,
    });
  };

  // Clear all filters
  const resetFilters = () => {
    setFilters({});
    setCurrentPage(1);
    
    toast({
      title: "Filters Reset",
      description: "Showing all orders",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Order Dashboard</h1>
            <p className="text-gray-500 mt-2">
              Manage and reconcile Bybit P2P orders
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={filterToday}>Today's Orders</Button>
            <Button variant="outline" onClick={resetFilters}>Reset Filters</Button>
          </div>
        </div>

        {/* API Connection Status Alert */}
        {apiStatus.isConnected !== null && (
          <Alert variant={apiStatus.isConnected ? "default" : "destructive"}>
            <div className="flex items-center">
              {apiStatus.isConnected ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              <div>
                <AlertTitle>API Status</AlertTitle>
                <AlertDescription>
                  {apiStatus.message}
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        <FilterBar
          onFilter={handleFilter}
          onExport={handleExport}
          onSync={handleSync}
          isAdmin={isAdmin}
          isSyncing={isSyncing}
          statusOptions={statusOptions}
        />

        <div className="flex justify-end">
          <CsvImporter onImportSuccess={handleCsvImportSuccess} />
        </div>

        <div>
          <div className="text-sm text-gray-500 mb-2">
            Showing {orders.length} of {totalOrders} orders
            {filters.start_date && filters.start_date === filters.end_date && (
              <span> for {filters.start_date}</span>
            )}
          </div>
          <OrdersTable orders={orders} isLoading={isLoading} />
        </div>

        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Show current page and adjacent pages
              let pageToShow;
              if (totalPages <= 5) {
                pageToShow = i + 1;
              } else if (currentPage <= 3) {
                pageToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageToShow = totalPages - 4 + i;
              } else {
                pageToShow = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pageToShow}>
                  <PaginationLink
                    isActive={pageToShow === currentPage}
                    onClick={() => handlePageChange(pageToShow)}
                  >
                    {pageToShow}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            <PaginationItem>
              <PaginationNext
                onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};

export default Dashboard;
