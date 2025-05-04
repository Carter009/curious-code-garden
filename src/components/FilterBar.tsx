
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { FilterParams } from '@/types/models';
import { Calendar as CalendarIcon, Search, FilterX, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface FilterBarProps {
  onFilter: (filters: FilterParams) => void;
  onExport: () => void;
  onSync: () => void;
  isAdmin: boolean;
  isSyncing: boolean;
  statusOptions: string[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  onFilter,
  onExport,
  onSync,
  isAdmin,
  isSyncing,
  statusOptions,
}) => {
  const [filters, setFilters] = useState<FilterParams>({});
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Apply filters when they change
  useEffect(() => {
    // Don't filter on initial render or when filters are reset
    if (Object.keys(filters).length > 0) {
      onFilter(filters);
    }
  }, [filters, onFilter]);

  const handleFilterChange = (key: keyof FilterParams, value: any) => {
    setFilters((prev) => {
      if (value === undefined || value === 'all' || value === '') {
        const newFilters = { ...prev };
        delete newFilters[key];
        return newFilters;
      }
      return { ...prev, [key]: value };
    });
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    handleFilterChange('start_date', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    handleFilterChange('end_date', date ? format(date, 'yyyy-MM-dd') : undefined);
  };

  const resetFilters = () => {
    setFilters({});
    setStartDate(undefined);
    setEndDate(undefined);
    onFilter({});
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search" className="mb-1">Search</Label>
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Order ID, name, nickname..."
              className="pl-8"
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>

        {/* Date Filters */}
        <div className="w-[200px]">
          <Label htmlFor="start-date" className="mb-1">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                id="start-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="w-[200px]">
          <Label htmlFor="end-date" className="mb-1">End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
                id="end-date"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP') : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Side Filter */}
        <div className="w-[150px]">
          <Label htmlFor="side" className="mb-1">Side</Label>
          <Select 
            value={filters.side || 'all'}
            onValueChange={(value) => handleFilterChange('side', value === 'all' ? undefined : value)}
          >
            <SelectTrigger id="side" className="w-full">
              <SelectValue placeholder="All sides" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sides</SelectItem>
              <SelectItem value="BUY">Buy</SelectItem>
              <SelectItem value="SELL">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="w-[150px]">
          <Label htmlFor="status" className="mb-1">Status</Label>
          <Select 
            value={filters.status || 'all'}
            onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reconciled Filter */}
        <div className="w-[150px]">
          <Label className="mb-1">Reconciled</Label>
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="reconciled-yes"
              checked={filters.reconciled === 'true'}
              onCheckedChange={(checked) => {
                handleFilterChange('reconciled', checked ? 'true' : undefined);
              }}
            />
            <label
              htmlFor="reconciled-yes"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Yes
            </label>

            <Checkbox 
              id="reconciled-no"
              checked={filters.reconciled === 'false'}
              onCheckedChange={(checked) => {
                handleFilterChange('reconciled', checked ? 'false' : undefined);
              }}
            />
            <label
              htmlFor="reconciled-no"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              No
            </label>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-2">
        <div className="space-x-2">
          <Button variant="outline" onClick={resetFilters}>
            <FilterX className="mr-1 h-4 w-4" />
            Reset Filters
          </Button>
          <Button variant="outline" onClick={onExport}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        </div>
        
        {isAdmin && (
          <Button 
            onClick={onSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`mr-1 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Orders'}
          </Button>
        )}
      </div>
    </div>
  );
};
