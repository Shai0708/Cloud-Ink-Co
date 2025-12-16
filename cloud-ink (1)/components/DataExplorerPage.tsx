
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { departmentDataConfig } from '../constants';
import { getTableData, getCount } from '../lib/supabase';
import DataTable from './DataTable';
import DetailsModal from './DetailsModal';
import { SpinnerIcon, DatabaseIcon, SearchIcon } from './icons';
import AnimatedWrapper from './AnimatedWrapper';

const ROWS_PER_PAGE = 20;

const DataExplorerPage: React.FC = () => {
    const tableConfigs = useMemo(() => Object.values(departmentDataConfig), []);
    const uniqueTableConfigs = useMemo(() => {
        const seen = new Set();
        return tableConfigs.filter(el => {
            const duplicate = seen.has(el.table);
            seen.add(el.table);
            return !duplicate;
        });
    }, [tableConfigs]);

    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [selectedRow, setSelectedRow] = useState<any | null>(null);
    
    const currentConfig = useMemo(() => 
        selectedTable ? uniqueTableConfigs.find(c => c.table === selectedTable) : null,
    [selectedTable, uniqueTableConfigs]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setCurrentPage(1);
            setTotalRows(0);
            setSelectedRow(null);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);

    const fetchData = useCallback(async (page: number) => {
        if (!selectedTable || !currentConfig) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const count = await getCount(selectedTable, [], debouncedSearchQuery, currentConfig.searchableColumns);
            setTotalRows(count);

            const resultData = await getTableData(
                selectedTable, 
                currentConfig.selectQuery || '*', 
                page, 
                ROWS_PER_PAGE, 
                sortColumn, 
                sortDirection,
                debouncedSearchQuery,
                currentConfig.searchableColumns
            );
            setData(resultData || []);
        } catch (e: any) {
            console.error(e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [selectedTable, currentConfig, sortColumn, sortDirection, debouncedSearchQuery]);

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
          setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
          setSortColumn(columnKey);
          setSortDirection('asc');
        }
        setCurrentPage(1);
        setSelectedRow(null);
    };
    
    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        setSelectedRow(null);
    }

    useEffect(() => {
        if (selectedTable) {
            setCurrentPage(1);
            setTotalRows(0);
            setData([]);
            setSortColumn(null);
            setSearchQuery('');
            setDebouncedSearchQuery('');
            setSelectedRow(null);
        }
    }, [selectedTable]);

    useEffect(() => {
        if (selectedTable) {
            fetchData(currentPage);
        }
    }, [currentPage, fetchData, selectedTable]);
    
    return (
        <AnimatedWrapper delay={0}>
            <div className="max-w-7xl mx-auto">
                <div className="p-8 bg-[#111827]/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10 transition-all duration-300 hover:shadow-cyan-glow">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6 border-b border-gray-700 pb-6">
                        <DatabaseIcon className="h-16 w-16 text-cyan-400" />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider">Data Explorer</h1>
                            <p className="mt-2 text-md text-[#A9B4C2]">Select a table to view its contents directly from the database.</p>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h2 className="text-lg font-semibold text-gray-200 mb-4">Available Tables</h2>
                        <div className="flex flex-wrap gap-3">
                            {uniqueTableConfigs.map(config => (
                                <button
                                    key={config.table}
                                    onClick={() => setSelectedTable(config.table)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#1F2937] focus:ring-cyan-500 ${selectedTable === config.table ? 'bg-cyan-600 text-white' : 'bg-[#1F2937] text-gray-300 hover:bg-cyan-950/50'}`}
                                >
                                    {config.table}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div className="mt-8 min-h-[20rem] relative">
                        {selectedTable && currentConfig && (
                            <div className="relative mb-4">
                                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder={`Search in ${selectedTable}...`}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-[#1F2937] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
                                />
                            </div>
                        )}

                        {loading && data.length === 0 && (
                            <div className="flex items-center justify-center h-64">
                                <SpinnerIcon className="animate-spin h-8 w-8 text-cyan-400" />
                                <span className="ml-3 text-gray-300">Loading data for "{selectedTable}"...</span>
                            </div>
                        )}
                        {error && (
                             <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg" role="alert">
                                <p><strong className="font-bold">Unable to load data</strong></p>
                                <p className="mt-1 text-sm">{error}</p>
                            </div>
                        )}
                        {!loading && !error && selectedTable && data.length === 0 && (
                            <p className="text-gray-400 text-center pt-16">No data found matching your criteria in "{selectedTable}".</p>
                        )}
                        {!loading && !error && selectedTable && data.length > 0 && currentConfig && (
                            <>
                                {loading && (
                                    <div className="absolute top-16 right-4 z-10">
                                        <SpinnerIcon className="animate-spin h-5 w-5 text-cyan-400" />
                                    </div>
                                )}
                                <DataTable
                                    headers={currentConfig.headers}
                                    data={data}
                                    dataKeys={currentConfig.dataKeys}
                                    currentPage={currentPage}
                                    totalRows={totalRows}
                                    rowsPerPage={ROWS_PER_PAGE}
                                    onPageChange={handlePageChange}
                                    sortColumn={sortColumn}
                                    sortDirection={sortDirection}
                                    onSort={handleSort}
                                    onRowClick={setSelectedRow}
                                    selectedRow={selectedRow}
                                />
                            </>
                        )}
                         {!selectedTable && (
                            <div className="flex flex-col items-center justify-center h-64 text-center">
                                <DatabaseIcon className="h-12 w-12 text-gray-600 mb-4" />
                                <p className="text-gray-400">Please select a table to begin exploring.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
             {selectedRow && currentConfig && (
                <DetailsModal
                data={selectedRow}
                headers={currentConfig.headers}
                dataKeys={currentConfig.dataKeys}
                title={`Details for ${currentConfig.table}`}
                onClose={() => setSelectedRow(null)}
                />
            )}
        </AnimatedWrapper>
    );
};

export default DataExplorerPage;
