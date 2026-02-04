import Onyx from 'react-native-onyx';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import type {ImportTransactionSettings} from '@src/types/onyx/ImportedSpreadsheet';
import type {SavedCSVColumnLayoutData} from '@src/types/onyx/SavedCSVColumnLayout';

function setSpreadsheetData(
    data: string[][],
    fileURI: string,
    fileType: string,
    fileName: string,
    isImportingMultiLevelTags: boolean,
    importTransactionSettings?: ImportTransactionSettings,
): Promise<void | void[]> {
    // Validate that data is a non-empty array
    if (!Array.isArray(data) || data.length === 0) {
        return Promise.reject(new Error('Invalid data format: data is empty or not an array'));
    }

    // Validate that we have at least one row with data
    const firstRow = data.at(0);
    if (!Array.isArray(firstRow) || firstRow.length === 0) {
        return Promise.reject(new Error('Invalid data format: first row is empty or not an array'));
    }

    // Require at least 2 rows (header + data) for most imports
    if (data.length < 2) {
        return Promise.reject(new Error('Invalid data format: file must contain at least 2 rows'));
    }

    const numColumns = firstRow.length;

    // Transpose data from row-major to column-major format
    const transposedData: string[][] = firstRow.map((_, colIndex) => data.map((row) => String(row.at(colIndex) ?? '')));

    const columnNames: Record<number, string> = {};
    for (let colIndex = 0; colIndex < numColumns; colIndex++) {
        columnNames[colIndex] = CONST.CSV_IMPORT_COLUMNS.IGNORE;
    }

    // Use Onyx.set to replace the entire object (avoiding stale column data from previous files)
    // but include the preserved settings passed from the caller
    return Onyx.set(ONYXKEYS.IMPORTED_SPREADSHEET, {
        data: transposedData,
        columns: columnNames,
        fileURI,
        fileType,
        fileName,
        isImportingMultiLevelTags,
        // Preserve transaction import settings that were configured before file upload
        importTransactionSettings,
        // Reset modal state for new import
        shouldFinalModalBeOpened: false,
        importFinalModal: undefined,
        containsHeader: true,
        isImportingIndependentMultiLevelTags: false,
        isGLAdjacent: false,
    });
}

function setColumnName(columnIndex: number, columnName: string): Promise<void> {
    return Onyx.merge(ONYXKEYS.IMPORTED_SPREADSHEET, {columns: {[columnIndex]: columnName}});
}

function setContainsHeader(containsHeader: boolean): Promise<void> {
    return Onyx.merge(ONYXKEYS.IMPORTED_SPREADSHEET, {containsHeader});
}

function closeImportPage(): Promise<void> {
    return Onyx.merge(ONYXKEYS.IMPORTED_SPREADSHEET, {
        data: null,
        columns: null,
        shouldFinalModalBeOpened: false,
        importFinalModal: null,
        // Clear the import settings so the next import starts fresh
        importTransactionSettings: null,
    });
}

function setImportTransactionCardName(cardDisplayName: string): Promise<void> {
    return Onyx.merge(ONYXKEYS.IMPORTED_SPREADSHEET, {
        importTransactionSettings: {
            cardDisplayName,
        },
    });
}

function setImportTransactionCurrency(currency: string): Promise<void> {
    return Onyx.merge(ONYXKEYS.IMPORTED_SPREADSHEET, {
        importTransactionSettings: {
            currency,
        },
    });
}

function setImportTransactionSettings(cardDisplayName: string, currency: string, isReimbursable: boolean, flipAmountSign: boolean): Promise<void> {
    return Onyx.merge(ONYXKEYS.IMPORTED_SPREADSHEET, {
        importTransactionSettings: {
            cardDisplayName,
            currency,
            isReimbursable,
            flipAmountSign,
        },
    });
}

/**
 * Applies saved column mappings to the spreadsheet data if the column headers match.
 * This is used when importing transactions to an existing card that has a saved layout.
 *
 * @param spreadsheetData - The spreadsheet data in column-major format
 * @param savedLayout - The saved column layout for this card
 * @returns Promise that resolves when column mappings are applied
 */
function applySavedColumnMappings(spreadsheetData: string[][], savedLayout: SavedCSVColumnLayoutData): Promise<void | void[]> {
    const savedNames = savedLayout.columnMapping?.names;
    if (!savedNames) {
        return Promise.resolve();
    }

    // Build a map of column header names to column indexes (trimmed for comparison)
    const headerToIndex: Record<string, number> = {};
    spreadsheetData.forEach((column, index) => {
        const headerName = column[0]?.trim();
        if (headerName) {
            headerToIndex[headerName] = index;
        }
    });

    // For each saved role -> column name mapping, find the matching column index
    const columnUpdates: Record<number, string> = {};
    const roles = ['date', 'merchant', 'amount', 'category'] as const;

    for (const role of roles) {
        const savedColumnName = savedNames[role]?.trim();
        if (savedColumnName && headerToIndex[savedColumnName] !== undefined) {
            columnUpdates[headerToIndex[savedColumnName]] = role;
        }
    }

    // If we found any matching columns, apply the mappings
    if (Object.keys(columnUpdates).length > 0) {
        return Onyx.merge(ONYXKEYS.IMPORTED_SPREADSHEET, {columns: columnUpdates});
    }

    return Promise.resolve();
}

export {setSpreadsheetData, setColumnName, closeImportPage, setContainsHeader, setImportTransactionCardName, setImportTransactionCurrency, setImportTransactionSettings, applySavedColumnMappings};
