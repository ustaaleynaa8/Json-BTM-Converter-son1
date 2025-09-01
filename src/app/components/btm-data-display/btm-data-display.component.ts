import { Component, Input } from '@angular/core';
import { BtmDisplayData } from '../../interfaces/btm-data.interface';

@Component({
  selector: 'app-btm-data-display',
  templateUrl: './btm-data-display.component.html',
  styleUrls: ['./btm-data-display.component.scss']
})
export class BtmDataDisplayComponent {
  @Input() btmData!: BtmDisplayData;
  @Input() searchTerm = '';

  // Template içinde JSON.stringify vb. için
  public JSON = JSON;

  /** IBAN tablosu başlıkları */
  get ibanHeaders(): string[] {
    if (!this.btmData?.ibanData || this.btmData.ibanData.length === 0) return [];
    return Object.keys(this.btmData.ibanData[0]);
  }

  /** Details tablosu başlıkları */
  get detailsHeaders(): string[] {
    if (!this.btmData?.detailsData || this.btmData.detailsData.length === 0) return [];
    return Object.keys(this.btmData.detailsData[0]);
  }

  /** IBAN + Details birleştirilmiş veri */
  get mergedIbanDetailsData(): any[] {
    // Eğer btmData'da hazır combinedData varsa onu kullan
    if (this.btmData?.combinedData && this.btmData.combinedData.length > 0) {
      return this.btmData.combinedData;
    }

    // Yoksa IBAN ve Details'i birleştir
    if (!this.btmData?.ibanData || !this.btmData?.detailsData) return [];

    const merged: any[] = [];

    // IBAN kayıtları
    this.btmData.ibanData.forEach(iban => {
      merged.push({
        ...iban,
        DataType: 'IBAN Hesap',
        RowIndex: merged.length + 1
      });
    });

    // Detail kayıtları
    this.btmData.detailsData.forEach(detail => {
      merged.push({
        ...detail,
        DataType: 'Transaction Detail',
        RowIndex: merged.length + 1
      });
    });

    return merged;
  }

  /** Birleşik tablodaki kolon başlıkları */
  get mergedHeaders(): string[] {
    const merged = this.mergedIbanDetailsData;
    if (merged.length === 0) return [];

    const allKeys = new Set<string>();
    merged.forEach(row => {
      Object.keys(row || {}).forEach(k => allKeys.add(k));
    });

    const headers = Array.from(allKeys);
    return headers.sort((a, b) => {
      if (a === 'DataType') return -1;
      if (b === 'DataType') return 1;
      if (a === 'RowIndex') return -1;
      if (b === 'RowIndex') return 1;
      return a.localeCompare(b);
    });
  }

  /** Arama terimine göre filtreli birleşik veri */
  get filteredMergedData(): any[] {
    const merged = this.mergedIbanDetailsData;
    if (!this.searchTerm) return merged;

    const q = this.searchTerm.toLowerCase();
    return merged.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    );
  }

  /** --- GERİYE DÖNÜK UYUMLULUK ALIASLARI --- */
  // Template’te filteredCombinedData kullanıldığı için
  get filteredCombinedData(): any[] {
    return this.filteredMergedData ?? [];
  }

  // Template’te combinedHeaders kullanıldığı için
  get combinedHeaders(): string[] {
    return this.mergedHeaders ?? [];
  }
  /** ---------------------------------------- */

  /** BTM çıktısı için yapılandırılmış JSON */
  getBtmJsonOutput(): any {
    if (!this.btmData) return {};

    return {
      parameters: this.btmData.parametersData
        .reduce((obj, item) => ({ ...obj, [item.key]: item.value }), {}),
      header: this.btmData.headerData
        .reduce((obj, item) => ({ ...obj, [item.key]: item.value }), {}),
      ibanAccounts: this.btmData.ibanData,
      details: this.btmData.detailsData,
      combinedData: this.filteredMergedData
    };
  }
}
