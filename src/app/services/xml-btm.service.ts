import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class XmlBtmService {
    // BTM (IIS Express) portu: 44357
    private apiUrl = 'https://localhost:44357/api/account/processXml';
    private headers = new HttpHeaders({ 'Content-Type': 'application/xml' });

    constructor(private http: HttpClient) { }

    // B'ye HAM XML gönder → CSV metin al
    uploadXml(xml: string): Observable<string> {
        return this.http.post<string>(
            this.apiUrl,
            xml, // 🔑 JSON değil; direkt ham XML string
            { headers: this.headers, responseType: 'text' as 'json' } // 🔑 CSV text bekliyoruz
        );
    }
}
