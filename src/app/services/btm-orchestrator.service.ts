import { Injectable } from '@angular/core';
import { CsvFileConverterService } from './csv-file-converter.service';
import { CsvOptions } from './csv-converter.service';
import { XmlBtmService } from './xml-btm.service';
import { FileConverterService } from './file-converter.service';
import { catchError, throwError, firstValueFrom, timeout } from 'rxjs';

export interface OrchestratedResult {
  result: any[];
  properties?: string[];
  prettyJson?: any;
  via: string;
  parametersData: Array<{ key: string; value: string }>;
  headerData: Array<{ key: string; value: string }>;
}

export interface BtmTransformResult {
  processedData: Array<Record<string, string>>;
  parametersData: Array<{ key: string; value: string }>;
  headerData: Array<{ key: string; value: string }>;
  rawRows: any[];
}

@Injectable({ providedIn: 'root' })
export class BtmOrchestratorService {
  constructor(
    private xmlBtm: XmlBtmService,
    private fileConverter: FileConverterService,
    private csvFileConverter: CsvFileConverterService
  ) {}

  /**
   * XML dosyasını alır:
   * 1) BTM'yi dener (CSV string alır)
   * 2) CSV'yi doğrudan CsvFileConverterService'e paslar (tüm dönüşüm orada)
   * 3) BTM başarısızsa local XML converter'a düşer
   */
  async processXml(file: File, csvOptions?: CsvOptions): Promise<OrchestratedResult> {
    const xmlText = await this.readFileAsText(file);

    try {
      const csvString: string = await firstValueFrom(
        this.xmlBtm.uploadXml(xmlText).pipe(
          timeout(5000),
          catchError(err => {
            console.error('BTM service error:', err);
            // Daha spesifik error message
            const errorMsg = err?.error?.message || err?.message || 'BTM servisinde beklenmeyen bir hata oluştu';
            return throwError(() => new Error(`BTM Servisi: ${errorMsg}`));
          })
        )
      );

      // CSV string boş mu kontrol et
      if (!csvString || csvString.trim().length === 0) {
        throw new Error('BTM servisinden boş CSV yanıtı alındı');
      }

      const btmResult = this.transformBtmCsv(csvString);

      if (btmResult.processedData.length > 0) {
        console.log('BTM dönüşümü başarılı:', btmResult.processedData.length, 'kayıt');

        // Tablo başlıkları için sadece anlamlı anahtarları topla
        const properties = this.extractMeaningfulProperties(btmResult.processedData);

        return {
          result: btmResult.processedData,
          properties,
          prettyJson: btmResult.processedData,
          via: 'btm_grouped_final',
          parametersData: btmResult.parametersData,
          headerData: btmResult.headerData
        };
      }

      throw new Error('BTM dönüşümü anlamlı bir sonuç üretmedi');

    } catch (err: any) {
      console.error('BTM akışı sırasında hata, local XML converter deneniyor:', err.message);
      
      try {
        const converter = this.fileConverter.getConverter('xml');
        if (!converter) {
          throw new Error('XML dönüştürücü bulunamadı (local)');
        }
        const localResult = await converter.convert(file, {});
        return {
          result: localResult.result,
          properties: localResult.properties,
          prettyJson: localResult.result,
          via: 'local',
          parametersData: [],
          headerData: []
        };
      } catch (localErr: any) {
        // Hem BTM hem local başarısız olduysa, daha detaylı hata ver
        throw new Error(`XML işlemi başarısız - BTM: ${err.message}, Local: ${localErr.message}`);
      }
    }
  }

  // --------- Helpers ---------

  private readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(new Error('Dosya okuma hatası: ' + err));
      reader.readAsText(file);
    });
  }

  /**
   * BTM'den gelen CSV'yi gruplayarak ve birleştirerek dönüştürür.
   */
  private transformBtmCsv(csv: string): BtmTransformResult {
    const rows = this.parseTypeKeyValueCsv(csv);
    if (rows.length === 0) {
      return { processedData: [], parametersData: [], headerData: [], rawRows: [] };
    }

    const parametersData = this.extractKeyValue(rows, 'Parameters');
    const headerData = this.extractKeyValue(rows, 'Header');
    const paramObj = this.toObject(parametersData);
    const headerObj = this.toObject(headerData);

    const ibanGroups = this.groupByTypeAsObjects(rows, 'IbanHesap');
    const detailGroups = this.groupByTypeAsObjects(rows, 'Details');

    console.log(`Gruplar oluşturuldu: IbanHesap (${ibanGroups.length}), Details (${detailGroups.length})`);

    const processedData: Array<Record<string, string>> = [];
    const count = Math.max(ibanGroups.length, detailGroups.length);

    for (let i = 0; i < count; i++) {
      const iban = ibanGroups[i] || {};
      const detail = detailGroups[i] || {};

      // Önce ana verileri, sonra global verileri birleştir.
      // Bu, aynı anahtar varsa (örn: TotalAmount) ana verinin öncelikli olmasını sağlar.
      const mergedRecord = this.cleanRecord({
        ...paramObj,
        ...headerObj,
        ...iban,
        ...detail,
      });
      
      processedData.push(mergedRecord);
    }

    return {
      processedData,
      parametersData,
      headerData,
      rawRows: rows
    };
  }

  private parseTypeKeyValueCsv(csv: string): any[] {
    const lines = csv.trim().split(/\r?\n/);
    const rows: any[] = [];
    
    for (const line of lines) {
      // Boş satırları ve CSV başlığını atla
      if (!line.trim() || line.toLowerCase().startsWith('type,key,value')) continue;
      
      // CSV parsing'i daha dikkatli yap - virgülleri value içindeki virgüllerden ayır
      const firstCommaIndex = line.indexOf(',');
      const secondCommaIndex = line.indexOf(',', firstCommaIndex + 1);
      
      if (firstCommaIndex === -1 || secondCommaIndex === -1) {
        console.warn('Malformed CSV line:', line);
        continue;
      }
      
      const type = line.substring(0, firstCommaIndex).trim();
      const key = line.substring(firstCommaIndex + 1, secondCommaIndex).trim();
      const value = line.substring(secondCommaIndex + 1).trim();
      
      // Boş type veya key'leri atla
      if (type && key) {
        rows.push({ type, key, value });
      }
    }
    return rows;
  }

  private extractKeyValue(rows: any[], type: string): Array<{ key: string; value: string }> {
    return rows
      .filter(row => row.type === type)
      .map(row => ({ key: row.key, value: row.value }));
  }

  private toObject(pairs: Array<{ key: string; value: string }>): Record<string, string> {
    return pairs.reduce((obj, item) => ({ ...obj, [item.key]: item.value }), {});
  }

  /**
   * Satırları tipine göre mantıksal gruplara ayırır.
   * Bir tipin ilk anahtarı tekrarlandığında yeni bir grup başlatır.
   */
  private groupByTypeAsObjects(rows: any[], type: string): Array<Record<string, string>> {
    const filteredRows = rows.filter(row => row.type === type);
    if (filteredRows.length === 0) return [];

    const groups: Array<Record<string, string>> = [];
    let currentGroup: Record<string, string> = {};
    
    const firstKey = filteredRows[0].key;

    for (const row of filteredRows) {
      if (row.key === firstKey && Object.keys(currentGroup).length > 0) {
        groups.push(currentGroup);
        currentGroup = {};
      }
      currentGroup[row.key] = row.value;
    }

    if (Object.keys(currentGroup).length > 0) {
      groups.push(currentGroup);
    }

    return groups;
  }

  /**
   * Record'u temizler - boş değerleri kaldırır ve key'leri normalleştirir
   */
  private cleanRecord(record: Record<string, string>): Record<string, string> {
    const cleaned: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(record)) {
      // Boş veya null değerleri atla
      if (value != null && value.toString().trim() !== '') {
        // Key'i temizle - sayısal suffix'leri ve gereksiz karakterleri kaldır
        const cleanKey = this.normalizeKey(key);
        if (cleanKey) {
          cleaned[cleanKey] = value.toString().trim();
        }
      }
    }
    
    return cleaned;
  }

  /**
   * Key'leri normalleştirir - DestinationAccountNo2 -> DestinationAccountNo gibi
   */
  private normalizeKey(key: string): string {
    if (!key) return '';
    
    let normalized = key.trim();
    
    // Sayısal suffix'leri kaldır (DestinationAccountNo2 -> DestinationAccountNo)
    normalized = normalized.replace(/\d+$/, '');
    
    // Gereksiz karakterleri temizle
    normalized = normalized.replace(/[^a-zA-Z0-9_]/g, '');
    
    return normalized;
  }

  /**
   * Anlamlı property'leri çıkarır - boş veya gereksiz key'leri filtreler
   */
  private extractMeaningfulProperties(data: Array<Record<string, string>>): string[] {
    const allKeys = new Set<string>();
    
    data.forEach(row => {
      Object.keys(row).forEach(key => {
        // Sadece anlamlı key'leri ekle
        if (key && key.length > 1 && !key.match(/^[0-9]+$/)) {
          allKeys.add(key);
        }
      });
    });
    
    return Array.from(allKeys).sort();
  }
}