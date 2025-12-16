
import React from 'react';
import { SortAscIcon, SortDescIcon } from './icons';

interface DataTableProps {
  headers: string[];
  data: any[];
  dataKeys: string[];
  currentPage: number;
  totalRows: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (columnKey: string) => void;
  onRowClick: (row: any) => void;
  selectedRow: any | null;
}

const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    
    if (path === 'manager_full_name') {
        const first = obj['manager_first_name'] || '';
        const last = obj['manager_last_name'] || '';
        const fullName = `${first} ${last}`.trim();
        return fullName || 'N/A';
    }

    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const DataTable: React.FC<DataTableProps> = ({ headers, data, dataKeys, currentPage, totalRows, rowsPerPage, onPageChange, sortColumn, sortDirection, onSort, onRowClick, selectedRow }) => {
  const totalPages = Math.ceil(totalRows / rowsPerPage);

  const getStatusClass = (status: any) => {
    if (typeof status !== 'string') return 'bg-gray-500/20 text-gray-300';
    
    switch (status.toLowerCase()) {
      case 'paid':
      case 'completed':
      case 'in stock':
      case 'active':
        return 'bg-green-500/20 text-green-300';
      case 'pending':
      case 'scheduled':
      case 'low stock':
        return 'bg-yellow-500/20 text-yellow-300';
      case 'overdue':
      case 'cancelled':
      case 'out of stock':
      case 'inactive':
        return 'bg-red-500/20 text-red-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const buttonClass = "px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111827] focus:ring-cyan-500";
  const enabledClass = "bg-[#1F2937] text-gray-300 hover:bg-cyan-950/50";
  const disabledClass = "bg-gray-800 text-gray-500 cursor-not-allowed";

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-[#1F2937]">
            <tr>
              {headers.map((header, index) => {
                const key = dataKeys[index];
                const isSorted = sortColumn === key;
                return (
                    <th
                    key={header}
                    scope="col"
                    className="py-3.5 px-4 text-left text-sm font-semibold text-white"
                    >
                    <button
                        onClick={() => onSort(key)}
                        className="flex items-center space-x-1 group focus:outline-none"
                    >
                        <span>{header}</span>
                        {isSorted ? (
                        sortDirection === 'asc' ? (
                            <SortAscIcon className="h-4 w-4" />
                        ) : (
                            <SortDescIcon className="h-4 w-4" />
                        )
                        ) : null}
                    </button>
                    </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                onClick={() => onRowClick(row)}
                className={`transition-colors duration-200 cursor-pointer 
                  ${selectedRow === row ? 'bg-cyan-900' : 'odd:bg-[#111827] even:bg-[#1F2937]/50 hover:bg-cyan-950/30'}
                `}
                >
                {dataKeys.map((key, cellIndex) => {
                   const value = getNestedValue(row, key);
                   return (
                      <td key={cellIndex} className="whitespace-nowrap px-4 py-4 text-sm text-gray-300">
                        {key.endsWith('status') ? (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(value)}`}>
                            {value}
                          </span>
                        ) : (
                          value
                        )}
                      </td>
                    );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`${buttonClass} ${currentPage === 1 ? disabledClass : enabledClass}`}
          >
            Previous
          </button>
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`${buttonClass} ${currentPage === totalPages ? disabledClass : enabledClass}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default DataTable;
