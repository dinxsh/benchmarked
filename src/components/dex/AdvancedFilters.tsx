'use client';

import { useState, useEffect } from 'react';
import { X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FilterCriteria {
  dexName?: string;
  volumeMin?: number;
  volumeMax?: number;
  liquidityMin?: number;
  liquidityMax?: number;
  addressPattern?: string;
}

interface AdvancedFiltersProps {
  onFilterChange: (filters: FilterCriteria) => void;
}

export function AdvancedFilters({ onFilterChange }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({});

  // Keyboard shortcut: Ctrl+F to focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFilterChange = (key: keyof FilterCriteria, value: string) => {
    const numValue = value === '' ? undefined : Number(value);
    const newFilters = {
      ...filters,
      [key]: key === 'dexName' || key === 'addressPattern' ? value || undefined : numValue
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFilterChange({});
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '');

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={`h-6 px-2 border-2 border-foreground font-mono text-[10px] uppercase ${
          hasActiveFilters ? 'bg-accent text-accent-foreground' : ''
        }`}
      >
        <Filter className="h-3 w-3 mr-1" />
        FILTERS {hasActiveFilters && `(${Object.values(filters).filter(v => v).length})`}
      </Button>
    );
  }

  return (
    <div className="border-2 border-foreground bg-background mt-2">
      {/* Header */}
      <div className="border-b-2 border-foreground px-2 py-1 flex items-center justify-between bg-muted/10">
        <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider">
          <Filter className="inline h-3 w-3 mr-1" />
          ADVANCED FILTERS
        </h3>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-5 px-2 text-[9px] font-mono uppercase"
            >
              CLEAR ALL
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-5 w-5 p-0 border border-foreground"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Filter Inputs */}
      <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* DEX Name */}
        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            DEX NAME
          </label>
          <div className="relative">
            <Input
              type="text"
              value={filters.dexName || ''}
              onChange={(e) => handleFilterChange('dexName', e.target.value)}
              placeholder="e.g., Uniswap"
              className="h-7 text-[11px] font-mono border-2 border-foreground pr-6"
            />
            {filters.dexName && (
              <button
                onClick={() => handleFilterChange('dexName', '')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Volume Min */}
        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            VOLUME MIN ($)
          </label>
          <div className="relative">
            <Input
              type="number"
              value={filters.volumeMin || ''}
              onChange={(e) => handleFilterChange('volumeMin', e.target.value)}
              placeholder="0"
              className="h-7 text-[11px] font-mono border-2 border-foreground pr-6 tabular-nums"
            />
            {filters.volumeMin && (
              <button
                onClick={() => handleFilterChange('volumeMin', '')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Volume Max */}
        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            VOLUME MAX ($)
          </label>
          <div className="relative">
            <Input
              type="number"
              value={filters.volumeMax || ''}
              onChange={(e) => handleFilterChange('volumeMax', e.target.value)}
              placeholder="∞"
              className="h-7 text-[11px] font-mono border-2 border-foreground pr-6 tabular-nums"
            />
            {filters.volumeMax && (
              <button
                onClick={() => handleFilterChange('volumeMax', '')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Liquidity Min */}
        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            LIQUIDITY MIN ($)
          </label>
          <div className="relative">
            <Input
              type="number"
              value={filters.liquidityMin || ''}
              onChange={(e) => handleFilterChange('liquidityMin', e.target.value)}
              placeholder="0"
              className="h-7 text-[11px] font-mono border-2 border-foreground pr-6 tabular-nums"
            />
            {filters.liquidityMin && (
              <button
                onClick={() => handleFilterChange('liquidityMin', '')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Liquidity Max */}
        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            LIQUIDITY MAX ($)
          </label>
          <div className="relative">
            <Input
              type="number"
              value={filters.liquidityMax || ''}
              onChange={(e) => handleFilterChange('liquidityMax', e.target.value)}
              placeholder="∞"
              className="h-7 text-[11px] font-mono border-2 border-foreground pr-6 tabular-nums"
            />
            {filters.liquidityMax && (
              <button
                onClick={() => handleFilterChange('liquidityMax', '')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Address Pattern (Regex) */}
        <div>
          <label className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block mb-1">
            ADDRESS PATTERN (REGEX)
          </label>
          <div className="relative">
            <Input
              type="text"
              value={filters.addressPattern || ''}
              onChange={(e) => handleFilterChange('addressPattern', e.target.value)}
              placeholder="^0x[a-f0-9]+$"
              className="h-7 text-[11px] font-mono border-2 border-foreground pr-6"
            />
            {filters.addressPattern && (
              <button
                onClick={() => handleFilterChange('addressPattern', '')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="border-t border-foreground px-3 py-1 bg-muted/5">
        <p className="text-[9px] font-mono text-muted-foreground uppercase">
          HINT: PRESS CTRL+F TO OPEN FILTERS
        </p>
      </div>
    </div>
  );
}
