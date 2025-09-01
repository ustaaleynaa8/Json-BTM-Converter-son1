import { Injectable } from "@angular/core"
import { CsvConverterService } from "./csv-converter.service"
import { CsvOptions } from "../interfaces/table-data.interface"
import { IFileConverter } from "../interfaces/ifile-converter"

@Injectable({
    providedIn: "root",
})
export class CsvFileConverterService implements IFileConverter {
    constructor(private csvConverter: CsvConverterService) { }

    async convert(file: File, options: CsvOptions): Promise<any> {
        return this.csvConverter.convertFileToJson(file, options)
    }
}
