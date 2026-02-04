import type { Table } from '@tanstack/react-table';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from '@radix-ui/react-icons';

interface DataTablePaginationProps<TData> extends React.ComponentProps<'div'> {
  table: Table<TData>;
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 30, 40, 50],
  className,
  ...props
}: DataTablePaginationProps<TData>) {
  const showPaginationControls = table.getPageCount() > 1;

  return (
    <div
      className={cn(
        'flex w-full items-center justify-between gap-4 overflow-auto px-2 py-1',
        className
      )}
      {...props}
    >
      <div className='flex-1 text-xs text-muted-foreground whitespace-nowrap'>
        {table.getFilteredRowModel().rows.length} row(s)
      </div>

      {showPaginationControls && (
        <div className='flex items-center gap-4 lg:gap-6'>
          <div className='flex items-center space-x-2'>
            <p className='text-xs font-medium whitespace-nowrap text-muted-foreground'>Rows per page</p>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className='h-7 w-[4.5rem] text-xs'>
                <SelectValue placeholder={table.getState().pagination.pageSize} />
              </SelectTrigger>
              <SelectContent side='top'>
                {pageSizeOptions.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center justify-center text-xs font-medium w-[80px]'>
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              aria-label='Go to first page'
              variant='outline'
              size='icon'
              className='hidden size-7 lg:flex'
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              aria-label='Go to previous page'
              variant='outline'
              size='icon'
              className='size-7'
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              aria-label='Go to next page'
              variant='outline'
              size='icon'
              className='size-7'
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              aria-label='Go to last page'
              variant='outline'
              size='icon'
              className='hidden size-7 lg:flex'
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
