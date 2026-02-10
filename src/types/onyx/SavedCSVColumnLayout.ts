/** Column mapping indexes for a CSV import (values are column index as numbers, or false if not mapped) */
type ColumnMappingIndexes = {
    date?: number | boolean;
    merchant?: number | boolean;
    amount?: number | boolean;
    category?: number | boolean;
    ignore?: number | boolean;
    type?: number | boolean;
};

/** Column mapping names for a CSV import (values are header names, or false if not mapped) */
type ColumnMappingNames = {
    date?: string | boolean;
    merchant?: string | boolean;
    amount?: string | boolean;
    category?: string | boolean;
    ignore?: string | boolean;
    type?: string | boolean;
};

/** Account details for a saved CSV layout */
type AccountDetails = {
    /** Bank type */
    bank: string;

    /** Currency code */
    currency: string;

    /** Card name (stored as accountID for oldDot compatibility) */
    accountID: string;

    /** Whether transactions are reimbursable */
    reimbursable?: boolean;
};

/** Column mapping configuration */
type ColumnMapping = {
    /** Mapping of transaction attributes to column header names */
    names: ColumnMappingNames;

    /** Mapping of transaction attributes to column indexes */
    indexes: ColumnMappingIndexes;
};

/** Column layout data for a saved CSV layout (structure matches oldDot) */
type SavedCSVColumnLayoutData = {
    /** Layout name */
    name: string;

    /** Whether to use type column for debit/credit */
    useTypeColumn: boolean;

    /** Whether to flip the amount sign */
    flipAmountSign: boolean;

    /** Whether transactions are reimbursable */
    reimbursable: boolean;

    /** Row offset (1 if has header, 0 otherwise) */
    offset: number;

    /** Date format string (null for auto-detect) */
    dateFormat?: string | null;

    /** Account details */
    accountDetails: AccountDetails;

    /** Column mapping configuration */
    columnMapping: ColumnMapping;
};

/** Saved CSV column layouts, keyed by cardID or layout name */
type SavedCSVColumnLayoutList = Record<string, SavedCSVColumnLayoutData>;

export type {ColumnMappingNames, ColumnMappingIndexes, SavedCSVColumnLayoutData, SavedCSVColumnLayoutList, AccountDetails, ColumnMapping};
