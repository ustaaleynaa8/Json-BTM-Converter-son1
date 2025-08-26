import { Component, OnInit } from "@angular/core"
import { AuthService, User } from "../../services/auth.service"
import { DatabaseService } from "../../services/database.service"
import { Router } from "@angular/router"
import { TxtToJsonOptions } from "src/app/services/txt-to-json.service"
import { CsvOptions } from "src/app/services/csv-converter.service"

interface TableData {
    [key: string]: any
}

@Component({
    selector: "app-dashboard",
    templateUrl: "./dashboard.component.html",
    styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
    currentUser: User | null = null

    jsonData: TableData[] = []
    tableHeaders: string[] = []
    searchTerm = ""

    currentFileType: "csv" | "txt" | "xml" | null = null

    csvOptions: CsvOptions = {
        hasHeader: true,
        skipEmptyLines: true,
        selectedDelimiter: ",",
        doubleQuoteWrap: true,
        selectedRowDelimiter: "newline",
        rowPrefix: "",
        rowSuffix: "",
        selectedEncoding: "utf-8",
        selectedQuoteOption: "none",
        trimWhitespace: true,
    }

    txtOptions: TxtToJsonOptions = {
        fieldCount: 3,
        startPositions: [0, 10, 20],
        lengths: [10, 10, 10],
        hasHeader: true,
        skipEmptyLines: true,
    }

    txtFieldConfigs: Array<{ start: number; length: number }> = [
        { start: 0, length: 10 },
        { start: 10, length: 10 },
        { start: 20, length: 10 },
    ]

    constructor(
        private authService: AuthService,
        private databaseService: DatabaseService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.currentUser = this.authService.getCurrentUser()

        if (!this.currentUser) {
            this.router.navigate(["/login"])
        }
    }

    logout(): void {
        this.authService.logout()
        this.router.navigate(["/login"])
    }

    onFileConverted(result: any): void {
        console.log("File converted successfully:", result)

        this.jsonData = result.result || result.data || []
        this.tableHeaders = result.properties || result.headers || []
        this.currentFileType = result.type || "csv" // default csv olarak işaretliyoruz

        if (!Array.isArray(this.jsonData)) {
            console.error("Geçersiz jsonData formatı:", this.jsonData)
            this.onConversionError("Veri okunamadı veya biçim hatalı.")
        } else {
            console.log("Data ready for backend:", this.jsonData)
        }
    }

    onConversionError(error: string): void {
        console.error("File conversion failed:", error)
        alert("Hata: " + error)
        this.jsonData = []
        this.tableHeaders = []
    }

    onFileClear(): void {
        this.jsonData = []
        this.tableHeaders = []
        this.searchTerm = ""
        this.currentFileType = null
    }

    onOptionsChanged(options: any): void {
        console.log("Options changed:", options)

        if (options.selectedDelimiter !== undefined) {
            this.csvOptions = { ...options }
            this.currentFileType = "csv"
        }

        if (options.fieldCount !== undefined) {
            this.txtOptions = { ...options }
            this.currentFileType = "txt"

            if (options.startPositions && options.lengths) {
                this.txtFieldConfigs = options.startPositions.map(
                    (start: number, index: number) => ({
                        start: start,
                        length: options.lengths[index] || 10,
                    })
                )
            }
        }

        if (options.xmlRootElement || options.xmlFieldMapping) {
            this.currentFileType = "xml"
        }
    }

    getCurrentOptions(): CsvOptions | TxtToJsonOptions | any {
        switch (this.currentFileType) {
            case "txt":
                return this.txtOptions
            case "csv":
                return this.csvOptions
            default:
                return {} // XML için henüz opsiyonlar ayrı tanımlanmadıysa
        }
    }

    get isTxtFile(): boolean {
        return this.currentFileType === "txt"
    }

    get isCsvFile(): boolean {
        return this.currentFileType === "csv"
    }

    sendToBackend(): void {
        if (!this.jsonData || this.jsonData.length === 0) {
            alert("Veri bulunamadı. Lütfen önce dosya yükleyin.")
            return
        }

        const batchSize = 50000
        const totalBatches = Math.ceil(this.jsonData.length / batchSize)
        console.log(
            `Gönderilecek veri: ${this.jsonData.length} kayıt, ${totalBatches} parça.`
        )

        const sendBatch = (batchIndex: number): void => {
            if (batchIndex >= totalBatches) {
                alert("✅ Tüm veriler başarıyla MongoDB'ye gönderildi.")
                return
            }

            const start = batchIndex * batchSize
            const end = start + batchSize
            const batch = this.jsonData.slice(start, end)

            this.databaseService.saveCsvData(batch).subscribe({
                next: (response) => {
                    const savedCount = response?.insertedIds
                        ? Object.keys(response.insertedIds).length
                        : batch.length

                    console.log(
                        `Batch ${batchIndex + 1}/${totalBatches} gönderildi. Kaydedilen: ${savedCount}`
                    )

                    sendBatch(batchIndex + 1)
                },
                error: (error) => {
                    console.error(`Batch ${batchIndex + 1} hatası:`, error)
                    alert("Veri gönderme hatası: " + error.message)
                },
            })
        }

        sendBatch(0)
    }
}
