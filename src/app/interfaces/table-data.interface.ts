export interface TableData {
    [key: string]: any;
}

export interface CsvOptions {
    hasHeader: boolean;
    skipEmptyLines: boolean;
    selectedDelimiter: string;
    doubleQuoteWrap: boolean;
    selectedRowDelimiter: string;
    rowPrefix: string;
    rowSuffix: string;
    selectedEncoding: string;
    selectedQuoteOption: 'none' | 'single' | 'double';
    trimWhitespace: boolean;
}

export interface FileConversionResult {
    result: TableData[];
    properties: string[];
    type: 'csv' | 'txt' | 'xml';
    parametersData?: TableData[];
    headerData?: TableData[];
    ibanData?: TableData[];
    detailsData?: TableData[];
    isBtmResult?: boolean;
    prettyJson?: string;
}
