import { Injectable } from '@angular/core';
import { IFileConverter } from '../interfaces/ifile-converter';

export interface XmlOptions {
    rootElement?: string;
    fieldMapping?: { [key: string]: string[] };
}

@Injectable({
    providedIn: 'root'
})
export class XmlFileConverterService implements IFileConverter {
    private defaultFieldMapping: { [key: string]: string[] } = {
        isim: ['isim', 'ad', 'name'],
        soyisim: ['soyisim', 'soyad', 'surname']
    };

    async convert(file: File, options: XmlOptions = {}): Promise<{ result: any[]; properties: string[]; type: string }> {
        const xmlString = await this.readFileAsText(file);
        const jsonArray = this.parseXmlToJson(xmlString, options);
        const firstRowKeys = jsonArray.length > 0 ? Object.keys(jsonArray[0]) : [];

        return {
            result: jsonArray,
            properties: firstRowKeys,
            type: 'xml'
        };
    }


    private parseXmlToJson(xmlString: string, options: XmlOptions = {}): any[] {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlString, 'text/xml');

        const parserError = xml.getElementsByTagName('parsererror');
        if (parserError.length > 0) {
            throw new Error('Geçersiz XML formatı: ' + parserError[0].textContent);
        }

        const root = options.rootElement
            ? xml.getElementsByTagName(options.rootElement)[0]
            : xml.documentElement;

        if (!root) {
            throw new Error(`Belirtilen root element (${options.rootElement}) bulunamadı.`);
        }

        const allChildren = Array.from(root.children);
        const mapping = options.fieldMapping || this.defaultFieldMapping;

        return allChildren.map(item => {
            const obj: any = {};
            Array.from(item.children).forEach(child => {
                obj[child.tagName] = child.textContent ?? '';
            });
            return this.mapFieldsWithOrder(obj, mapping);
        });
    }


    private mapFieldsWithOrder(obj: any, fieldMapping: { [key: string]: string[] }): any {
        const mapped: any = {};
        const usedFields: Set<string> = new Set();

        Object.keys(obj).forEach(key => {
            let mappedKey = key;
            for (const [target, aliases] of Object.entries(fieldMapping)) {
                if (aliases.includes(key)) {
                    mappedKey = target;
                    break;
                }
            }
            if (!usedFields.has(mappedKey)) {
                mapped[mappedKey] = obj[key];
                usedFields.add(mappedKey);
            }
        });
        return mapped;
    }

    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }
}
