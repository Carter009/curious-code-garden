
import React, { useState, useEffect } from 'react';
import { FilterParams } from '@/types/models';
import { format } from 'date-fns';
import { SearchFilter } from './filters/SearchFilter';
import { DateFilter } from './filters/DateFilter';
import { SelectFilter } from './filters/SelectFilter';
import { CheckboxFilter } from './filters/CheckboxFilter';
import { ActionButtons } from './filters/ActionButtons';

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

  // Prepare status options for the select filter
  const statusFilterOptions = [
    { value: 'all', label: 'All statuses' },
    ...statusOptions.map(status => ({ value: status, label: status }))
  ];

  // Prepare side options for the select filter
  const sideFilterOptions = [
    { value: 'all', label: 'All sides' },
    { value: 'BUY', label: 'Buy' },
    { value: 'SELL', label: 'Sell' }
  ];

  // Prepare reconciled options for the checkbox filter
  const reconciledOptions = [
    { id: 'reconciled-yes', label: 'Yes', value: 'true' },
    { id: 'reconciled-no', label: 'No', value: 'false' }
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        {/* Search Filter */}
        <SearchFilter 
          value={filters.search || ''} 
          onChange={(value) => handleFilterChange('search', value)} 
        />

        {/* Date Filters */}
        <DateFilter 
          label="Start Date"
          id="start-date"
          date={startDate}
          onSelect={handleStartDateSelect}
        />

        <DateFilter 
          label="End Date"
          id="end-date"
          date={endDate}
          onSelect={handleEndDateSelect}
        />

        {/* Side Filter */}
        <SelectFilter 
          id="side"
          label="Side"
          value={filters.side || 'all'}
          onChange={(value) => handleFilterChange('side', value)}
          placeholder="All sides"
          options={sideFilterOptions}
        />

        {/* Status Filter */}
        <SelectFilter 
          id="status"
          label="Status"
          value={filters.status || 'all'}
          onChange={(value) => handleFilterChange('status', value)}
          placeholder="All statuses"
          options={statusFilterOptions}
        />

        {/* Reconciled Filter */}
        <CheckboxFilter 
          label="Reconciled"
          options={reconciledOptions}
          value={filters.reconciled}
          onChange={(value) => handleFilterChange('reconciled', value)}
        />
      </div>

      {/* Action Buttons */}
      <ActionButtons 
        onReset={resetFilters}
        onExport={onExport}
        onSync={onSync}
        isAdmin={isAdmin}
        isSyncing={isSyncing}
      />
    </div>
  );
};
