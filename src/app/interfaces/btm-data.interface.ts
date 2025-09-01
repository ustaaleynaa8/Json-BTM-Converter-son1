export interface BtmDisplayData {
    parametersData: Array<{ key: string; value: string }>;
    headerData: Array<{ key: string; value: string }>;
    ibanData: any[];
    detailsData: any[];
    combinedData: any[];
}

export interface BtmProcessingResult {
    result: any[];
    properties: string[];
    parametersData: any[];
    headerData: any[];
    ibanData: any[];
    detailsData: any[];
    isBtmResult: boolean;
    via: 'btm-api' | 'local-fallback';
    prettyJson?: string;
}
