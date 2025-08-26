export interface IFileConverter {
    convert(file: File, options: any): Promise<any>
}
