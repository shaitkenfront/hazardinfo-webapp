# 設計書

## 概要

防災情報一覧化アプリは、複数の入力方式（住所、緯度経度、SUUMO URL、現在地）に対応し、統一されたインターフェースで防災情報を表示するWebアプリケーションです。

## アーキテクチャ

### システム構成
- **フロントエンド**: React + TypeScript
- **バックエンド**: Node.js + Express + TypeScript
- **データベース**: SQLite（キャッシュ用）
- **外部API**: 国土交通省ハザードマップAPI、気象庁API、地理院API

### アーキテクチャパターン
- レイヤードアーキテクチャ
- Repository パターン（データアクセス層）
- Service パターン（ビジネスロジック層）

## コンポーネントとインターフェース

### フロントエンド コンポーネント

#### 1. LocationInputComponent
- 住所、緯度経度、SUUMO URL、現在地の入力を統合
- 入力方式の切り替え機能
- バリデーション機能

#### 2. DisasterInfoDisplayComponent
- 防災情報の一覧表示
- リスクレベル別の色分け表示
- 詳細情報の展開/折りたたみ

#### 3. MapComponent
- 位置とハザード情報の地図表示
- インタラクティブなマップ機能

### バックエンド サービス

#### 1. LocationService
```typescript
interface LocationService {
  resolveAddress(address: string): Promise<Coordinates>
  parseCoordinates(lat: string, lng: string): Promise<Coordinates>
  extractLocationFromSuumo(url: string): Promise<Coordinates>
  getCurrentLocation(): Promise<Coordinates>
}
```

#### 2. DisasterInfoService
```typescript
interface DisasterInfoService {
  getHazardMapInfo(coordinates: Coordinates): Promise<HazardInfo[]>
  getEvacuationShelters(coordinates: Coordinates): Promise<Shelter[]>
  getDisasterHistory(coordinates: Coordinates): Promise<DisasterEvent[]>
  getWeatherAlerts(coordinates: Coordinates): Promise<WeatherAlert[]>
}
```

#### 3. CacheService
```typescript
interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl: number): Promise<void>
  invalidate(pattern: string): Promise<void>
}
```

## データモデル

### Coordinates
```typescript
interface Coordinates {
  latitude: number
  longitude: number
  address?: string
  source: 'address' | 'coordinates' | 'suumo' | 'geolocation'
}
```

### HazardInfo
```typescript
interface HazardInfo {
  type: 'flood' | 'earthquake' | 'landslide' | 'tsunami' | 'large_scale_fill'
  riskLevel: 'low' | 'medium' | 'high' | 'very_high'
  description: string
  source: string
  lastUpdated: Date
  detailUrl?: string
}
```

### Shelter
```typescript
interface Shelter {
  name: string
  address: string
  coordinates: Coordinates
  capacity: number
  facilities: string[]
  distance: number
}
```

### DisasterEvent
```typescript
interface DisasterEvent {
  type: string
  date: Date
  description: string
  severity: string
  source: string
}
```

## エラーハンドリング

### エラータイプ
1. **LocationNotFoundError**: 住所や座標が見つからない
2. **InvalidInputError**: 入力形式が無効
3. **ExternalAPIError**: 外部API呼び出しエラー
4. **GeolocationError**: 位置情報取得エラー
5. **SuumoParsingError**: SUUMO URL解析エラー

### エラー処理戦略
- フロントエンドでユーザーフレンドリーなエラーメッセージ表示
- バックエンドで詳細なエラーログ記録
- 外部API障害時のフォールバック機能
- タイムアウト処理とリトライ機能

## テスト戦略

### 単体テスト
- 各サービスクラスのメソッド
- データ変換ロジック
- バリデーション機能

### 統合テスト
- 外部API連携（モック使用）
- データベース操作
- エンドツーエンドのデータフロー

### E2Eテスト
- 主要なユーザーシナリオ
- エラーケースの処理
- レスポンシブデザインの確認

### テストデータ
- 実際の住所データセット
- 様々な災害リスクレベルのサンプル
- SUUMO URLのサンプル

## セキュリティ考慮事項

### データ保護
- 位置情報の適切な取り扱い
- キャッシュデータの暗号化
- ログでの個人情報マスキング

### API セキュリティ
- レート制限の実装
- CORS設定
- 入力値のサニタイゼーション

### 外部サービス連携
- SUUMO利用規約の遵守
- APIキーの安全な管理
- 外部サービス依存の最小化