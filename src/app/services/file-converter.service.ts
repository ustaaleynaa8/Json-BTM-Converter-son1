import { Injectable } from '@angular/core';
import { CsvFileConverterService } from './csv-file-converter.service';
import { TxtFileConverterService } from './txt-file-converter.service';
import { XmlFileConverterService } from './xml-file-converter.service';
import { IFileConverter } from '../interfaces/ifile-converter';

@Injectable({
    providedIn: 'root'
})
export class FileConverterService {
    constructor(
        private csvConverter: CsvFileConverterService,
        private txtConverter: TxtFileConverterService,
        private xmlConverter: XmlFileConverterService
    ) { }

    getConverter(extension: string): IFileConverter | null {
        switch (extension.toLowerCase()) {
            case 'csv':
                return this.csvConverter;
            case 'txt':
                return this.txtConverter;
            case 'xml':
                return this.xmlConverter;
            default:
                return null;
        }
    }
}
