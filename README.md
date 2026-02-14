# JSON BTM Converter 
Modern Angular tabanlı dosya dönüştürme uygulaması. CSV, XML ve TXT formatlarındaki dosyaları JSON formatına dönüştürür ve BTM (Business Transaction Management) entegrasyonu sağlar.

## 🌟 Özellikler

### 📁 Dosya Dönüştürme
- **CSV → JSON**: Esnek CSV parsing seçenekleri ile
- **XML → JSON**: BTM servisi üzerinden veya local dönüştürme
- **TXT → JSON**: Metin dosyalarını yapılandırılmış veriye çevirme

### 🎯 BTM Entegrasyonu
- XML dosyalarını BTM servisine gönderme
- BTM'den gelen CSV yanıtlarını JSON'a dönüştürme
- Hata durumunda local XML converter'a fallback

### 💾 Veri Yönetimi
- MongoDB entegrasyonu
- Dönüştürülen verileri kaydetme
- Geçmiş verileri görüntüleme

## 🛠️ Teknolojiler

### Frontend
- **Angular 14**: SPA framework
- **TypeScript**: Type-safe geliştirme
- **RxJS**: Reactive programming
- **SCSS**: Modern CSS preprocessing

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: NoSQL veritabanı
- **JWT**: Güvenli kimlik doğrulama

## 📋 Gereksinimler

- Node.js (v14+)
- Angular CLI (v14+)
- MongoDB
- npm veya yarn

## 🚀 Kurulum

### 1. Projeyi klonlayın
```bash
git clone https://github.com/ustaaleynaa8/Json-BTM-Converter-son1.git
cd Json-BTM-Converter-son1
```

### 2. Bağımlılıkları yükleyin
```bash
# Frontend bağımlılıkları
npm install

# Backend bağımlılıkları (eğer varsa)
cd backend
npm install
cd ..
```

### 3. MongoDB'yi başlatın
```bash
# MongoDB servisini başlatın
mongod
```

### 4. Uygulamayı çalıştırın
```bash
# Frontend (Angular)
npm start

# Backend (ayrı terminal)
cd backend
node server.js
```

## 🔧 Konfigürasyon

### Environment Variables
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  btmServiceUrl: 'http://btm-service-url',
  mongoUrl: 'mongodb://localhost:27017/json-converter'
};
```

## 📱 Kullanım

### 1. Giriş Yapın
- Kayıt olun veya mevcut hesabınızla giriş yapın
- JWT token otomatik olarak yönetilir

### 2. Dosya Yükleyin
- Dashboard'dan dosya seçin
- Parsing seçeneklerini ayarlayın
- "Dönüştür" butonuna tıklayın

### 3. Sonuçları Görüntüleyin
- Dönüştürülen veriler tablo halinde gösterilir
- JSON formatında indirilebilir
- Veritabanına kaydedilebilir

### 4. BTM Entegrasyonu
- XML dosyaları otomatik olarak BTM servisine gönderilir
- BTM'den gelen CSV yanıtı JSON'a dönüştürülür
- Hata durumunda local XML converter devreye girer


## 🚨 Hata Yönetimi

### BTM Entegrasyonu
- BTM servisi erişilemezse local converter devreye girer
- Timeout ayarları ile uzun süreli beklemeleri önler
- Detaylı hata mesajları kullanıcıya gösterilir

### Dosya İşlemleri
- Desteklenmeyen formatlar için uyarı
- Büyük dosyalar için progress indicator
- Hatalı CSV formatları için parsing fallback

## 👥 Ekip & Roller

- **Aleyna Usta** – XML Converter geliştirme, projelerin birleştirilmesi ve BTM entegrasyonu  
- **İris Akdemir** – CSV → JSON dönüştürme modülü  
- **Burak Uran** – TXT → JSON dönüştürme modülü  
- **Oğulcan Erdoğan** – BTM servis geliştirme


