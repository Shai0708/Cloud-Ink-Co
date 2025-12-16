
import React, { useState, useEffect, useCallback } from 'react';
import { Department, departmentDescriptions, departmentIconComponents, departmentDataConfig } from '../constants';
import AnimatedWrapper from './AnimatedWrapper';
import { getTableData, getCount } from '../lib/supabase';
import { supabase } from '../supabaseClient';
import DataTable from './DataTable';
import DetailsModal from './DetailsModal';
import { SpinnerIcon, SearchIcon } from './icons';

interface DepartmentPageProps {
  department: Department;
}

const ROWS_PER_PAGE = 20;

const DepartmentContent: React.FC<{ department: Department }> = ({ department }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const config = departmentDataConfig[department];
  
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
    if (!config) {
        setError("Configuration for this department is not available.");
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const count = await getCount(config.table, [], debouncedSearchQuery, config.searchableColumns);
      setTotalRows(count);
      
      let resultData = await getTableData(
          config.table, 
          config.selectQuery || '*', 
          page, 
          ROWS_PER_PAGE, 
          sortColumn, 
          sortDirection, 
          debouncedSearchQuery, 
          config.searchableColumns
      );

      // Manual Join for Appointments if Supabase relationship is missing
      if (department === Department.APPOINTMENTS && resultData && resultData.length > 0) {
        const pIds = [...new Set(resultData.map((r: any) => r.patient_id).filter(Boolean))];
        const eIds = [...new Set(resultData.map((r: any) => r.employee_id).filter(Boolean))];
        
        const [pRes, eRes] = await Promise.all([
            pIds.length > 0 ? supabase.from('patients').select('patient_id, first_name, last_name').in('patient_id', pIds) : { data: [] },
            eIds.length > 0 ? supabase.from('employees').select('employee_id, full_name').in('employee_id', eIds) : { data: [] }
        ]);
        
        const pMap = new Map((pRes.data || []).map((p: any) => [p.patient_id, p] as [any, any]));
        const eMap = new Map((eRes.data || []).map((e: any) => [e.employee_id, e] as [any, any]));
        
        resultData = resultData.map((r: any) => ({
            ...r,
            patients: pMap.get(r.patient_id) || null,
            employees: eMap.get(r.employee_id) || null
        }));
      }

      setData(resultData || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [department, config, sortColumn, sortDirection, debouncedSearchQuery]);

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
    setCurrentPage(1);
    setTotalRows(0);
    setData([]);
    setSortColumn(null);
    setSearchQuery('');
    setDebouncedSearchQuery('');
    setSelectedRow(null);
  }, [department]);

  useEffect(() => {
    fetchData(currentPage);
  }, [currentPage, fetchData]);

  if (error) {
    return (
        <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg" role="alert">
            <p><strong className="font-bold">Unable to load data</strong></p>
            <p className="mt-1 text-sm">{error}</p>
        </div>
    );
  }

  return (
    <>
      <div className="relative mb-4">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
          <input
              type="text"
              placeholder={`Search in ${department}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1F2937] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
          />
      </div>
      {loading && data.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <SpinnerIcon className="animate-spin h-8 w-8 text-cyan-400" />
          <span className="ml-3 text-gray-300">Loading data...</span>
        </div>
      ) : data.length === 0 ? (
        <p className="text-gray-400 text-center py-16">No data found matching your criteria in "{config.table}".</p>
      ) : (
        <>
          {loading && (
            <div className="absolute top-16 right-4 z-10">
              <SpinnerIcon className="animate-spin h-5 w-5 text-cyan-400" />
            </div>
          )}
          <DataTable 
            headers={config.headers} 
            data={data} 
            dataKeys={config.dataKeys}
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
      {selectedRow && (
        <DetailsModal
          data={selectedRow}
          headers={config.headers}
          dataKeys={config.dataKeys}
          title={`${department} Details`}
          onClose={() => setSelectedRow(null)}
        />
      )}
    </>
  );
};

const DepartmentPage: React.FC<DepartmentPageProps> = ({ department }) => {
  const IconComponent = departmentIconComponents[department];

  return (
    <AnimatedWrapper delay={0}>
      <div className="max-w-7xl mx-auto">
        <div className="p-8 bg-[#111827]/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10 transition-all duration-300 hover:shadow-cyan-glow">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6 border-b border-gray-700 pb-6">
            <IconComponent className="h-16 w-16 text-cyan-400" />
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider">{department}</h1>
              <p className="mt-2 text-md text-[#A9B4C2]">{departmentDescriptions[department]}</p>
            </div>
          </div>
          
          <div className="mt-8 relative">
              <DepartmentContent department={department} />
          </div>
        </div>
      </div>
    </AnimatedWrapper>
  );
};

export default DepartmentPage;
