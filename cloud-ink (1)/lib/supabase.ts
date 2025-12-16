
import { supabase } from '../supabaseClient';

/**
 * Fetches data from a specified Supabase table.
 * @param tableName - The name of the table to fetch data from.
 * @param selectQuery - The select query string (e.g., '*' or 'id, name, items(id, name)').
 * @param page - The page number to fetch.
 * @param rowsPerPage - The number of rows per page.
 * @param sortColumn - The column to sort by.
 * @param sortDirection - The direction to sort ('asc' or 'desc').
 * @param searchQuery - The text to search for.
 * @param searchableColumns - The columns to search within.
 * @returns A promise that resolves with the table data.
 * @throws An error if the data fetching fails.
 */
export const getTableData = async (
    tableName: string, 
    selectQuery: string, 
    page: number = 1, 
    rowsPerPage: number = 20,
    sortColumn?: string | null,
    sortDirection?: 'asc' | 'desc',
    searchQuery?: string,
    searchableColumns?: string[]
) => {
    const from = (page - 1) * rowsPerPage;
    const to = from + rowsPerPage - 1;

    let query = supabase
        .from(tableName)
        .select(selectQuery)
        .range(from, to);

    if (searchQuery && searchableColumns && searchableColumns.length > 0) {
        const orQuery = searchableColumns.map(column => `${column}.ilike.%${searchQuery}%`).join(',');
        query = query.or(orQuery);
    }
    
    if (sortColumn && sortDirection) {
        const isAscending = sortDirection === 'asc';
        if (sortColumn.includes('.')) {
            const [referencedTable, referencedColumn] = sortColumn.split('.');
            query = query.order(referencedColumn, { referencedTable: referencedTable, ascending: isAscending });
        } else {
            query = query.order(sortColumn, { ascending: isAscending });
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error(`Supabase error fetching from "${tableName}":`, error.message);
        throw new Error(`Failed to fetch data from ${tableName}. Error: ${error.message}. Please ensure the table exists and that Row Level Security (RLS) policies allow read access.`);
    }

    return data;
};

/**
 * Gets the total count of rows in a table, with optional filters and search.
 * @param tableName - The name of the table.
 * @param filters - An array of filters to apply to the query.
 * @param searchQuery - The text to search for.
 * @param searchableColumns - The columns to search within.
 * @returns A promise that resolves with the row count.
 */
export const getCount = async (
    tableName: string, 
    filters: { column: string; value: any; operator?: 'eq' | 'gte' | 'lte' | 'like' }[] = [],
    searchQuery?: string,
    searchableColumns?: string[]
) => {
    let query = supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

    filters.forEach(filter => {
        const op = filter.operator || 'eq';
        switch (op) {
            case 'eq':
                query = query.eq(filter.column, filter.value);
                break;
            case 'gte':
                query = query.gte(filter.column, filter.value);
                break;
            case 'lte':
                query = query.lte(filter.column, filter.value);
                break;
            case 'like':
                query = query.like(filter.column, filter.value);
                break;
        }
    });

    if (searchQuery && searchableColumns && searchableColumns.length > 0) {
        const orQuery = searchableColumns.map(column => `${column}.ilike.%${searchQuery}%`).join(',');
        query = query.or(orQuery);
    }

    const { count, error } = await query;

    if (error) {
        // If table doesn't exist, return 0 count instead of throwing, so dashboard doesn't crash completely
        if (error.code === '42P01') {
            console.warn(`Table "${tableName}" not found when counting.`);
            return 0;
        }
        console.error(`Supabase count error on "${tableName}":`, error.message);
        throw new Error(`Failed to count data from ${tableName}. Error: ${error.message}.`);
    }
    return count ?? 0;
};

/**
 * Calculates the sum of a numeric column in a table.
 * @param tableName - The name of the table.
 * @param columnName - The name of the column to sum.
 * @returns A promise that resolves with the total sum.
 */
export const getSum = async (tableName: string, columnName: string) => {
    const { data, error } = await supabase
        .from(tableName)
        .select(columnName);

    if (error) {
        if (error.code === '42P01') {
             console.warn(`Table "${tableName}" not found when summing.`);
             return 0;
        }
        console.error(`Supabase sum error on "${tableName}":`, error.message);
        throw new Error(`Failed to fetch data for sum from ${tableName}. Error: ${error.message}.`);
    }

    if (!data) return 0;

    return data.reduce((acc, row) => acc + (row[columnName] || 0), 0);
};

// Announcement CRUD operations

export const getAnnouncements = async () => {
    // Removed order by 'id' to avoid errors if the column does not exist in the database.
    const { data, error } = await supabase
        .from('announcements')
        .select('*');
    
    if (error) {
        // Code 42P01 is "relation does not exist". 
        // We return an empty array so the app still works if the table hasn't been created yet.
        if (error.code === '42P01') {
            console.warn('Announcements table does not exist. Returning empty list.');
            return [];
        }
        console.error('Error fetching announcements:', error.message);
        throw new Error(error.message);
    }
    return data;
};

export const createAnnouncement = async (title: string, content: string) => {
    // We do not include created_at in the insert payload, letting the DB handle it if it exists,
    // or ignoring it if it doesn't.
    const { error } = await supabase
        .from('announcements')
        .insert([{ title, content }]);
    
    if (error) {
        console.error('Error creating announcement:', error.message);
        throw new Error(error.message);
    }
};

export const updateAnnouncement = async (originalTitle: string, originalContent: string, newTitle: string, newContent: string) => {
    // Update matching by original title and content since ID might be missing or unreliable.
    const { error } = await supabase
        .from('announcements')
        .update({ title: newTitle, content: newContent })
        .eq('title', originalTitle)
        .eq('content', originalContent);

    if (error) {
        console.error('Error updating announcement:', error.message);
        throw new Error(error.message);
    }
};

export const deleteAnnouncement = async (title: string, content: string) => {
    // Modified to delete by title and content since 'id' column might be missing
    const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('title', title)
        .eq('content', content);

    if (error) {
        console.error('Error deleting announcement:', error.message);
        throw new Error(error.message);
    }
};
