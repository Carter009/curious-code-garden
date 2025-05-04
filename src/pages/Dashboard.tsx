
import React, { useState, useEffect } from 'react';
import { OrdersTable } from '@/components/OrdersTable';
import { FilterBar } from '@/components/FilterBar';
import { CsvImporter } from '@/components/CsvImporter';
import { ApiService } from '@/services/ApiService';
import { useSupabaseAuth } from '@/context/SupabaseAuthContext';
import { Order, FilterParams } from '@/types/models';
import { toast } from '@/hooks/use-toast';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const Dashboard = () => {
  const { user, isAdmin } = useSupabaseAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<FilterParams>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusOptions, setStatusOptions] = useState<string[]>([]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await ApiService.getOrders({
        ...filters,
        page: currentPage,
        per_page: 10
      });
      setOrders(response.orders);
      setTotalOrders(response.total);
      setTotalPages(response.pages);
      
      // Extract unique statuses for filter dropdown
      const uniqueStatuses = new Set<string>();
      response.orders.forEach(order => {
        if (order.status) uniqueStatuses.add(order.status);
      });
      setStatusOptions(Array.from(uniqueStatuses));
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters, currentPage]);

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

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await ApiService.syncOrders();
      toast({
        title: "Sync Successful",
        description: result.message,
      });
      fetchOrders(); // Reload orders after sync
    } catch (error: any) {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync orders from Bybit",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCsvImportSuccess = (count: number) => {
    toast({
      title: "CSV Import Complete",
      description: `Successfully imported ${count} orders from CSV`,
    });
    fetchOrders(); // Refresh the orders list
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Dashboard</h1>
          <p className="text-gray-500 mt-2">
            Manage and reconcile Bybit P2P orders
          </p>
        </div>

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
