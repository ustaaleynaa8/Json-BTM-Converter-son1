import { Injectable } from "@angular/core"
import { TxtToJsonService, TxtToJsonOptions } from "./txt-to-json.service"
import { IFileConverter } from "../interfaces/ifile-converter"

@Injectable({
    providedIn: "root",
})
export class TxtFileConverterService implements IFileConverter {
    constructor(private txtService: TxtToJsonService) { }

    async convert(file: File, options: TxtToJsonOptions): Promise<any> {
        const text = await file.text()
        const result = this.txtService.convert(text, options)

        return {
            properties: Object.keys(result[0] || {}),
            result: result,
        }
    }
}
