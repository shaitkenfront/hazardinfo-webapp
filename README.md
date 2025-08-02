# ハザード情報一括表示アプリ

住所、緯度経度、現在地などを指定することで、その地域の防災情報を一覧化して表示するWebアプリケーション。

## プロジェクト構成

```
disaster-info-app/
├── backend/                 # Node.js + Express + TypeScript バックエンド
│   ├── src/
│   │   ├── types/          # TypeScript型定義
│   │   ├── services/       # ビジネスロジック
│   │   ├── controllers/    # APIエンドポイント
│   │   ├── repositories/   # データアクセス層
│   │   ├── utils/          # ヘルパー関数
│   │   └── index.ts        # エントリーポイント
│   ├── package.json
│   ├── tsconfig.json
│   └── jest.config.js
├── frontend/               # React + TypeScript フロントエンド
│   ├── src/
│   │   ├── components/     # Reactコンポーネント
│   │   ├── services/       # APIクライアント
│   │   ├── types/          # TypeScript型定義
│   │   ├── utils/          # ヘルパー関数
│   │   ├── test/           # テスト設定
│   │   ├── App.tsx         # メインアプリコンポーネント
│   │   └── main.tsx        # エントリーポイント
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
└── package.json            # ルートパッケージ設定
```

## 開発環境のセットアップ

### 依存関係のインストール

```bash
# ルートディレクトリで実行
npm install

# バックエンドの依存関係
cd backend && npm install

# フロントエンドの依存関係
cd frontend && npm install
```

### 開発サーバーの起動

```bash
# 両方のサーバーを同時に起動
npm run dev

# または個別に起動
npm run dev:backend  # バックエンド (http://localhost:3001)
npm run dev:frontend # フロントエンド (http://localhost:3000)
```

### テストの実行

```bash
# 全てのテストを実行
npm test

# 個別にテストを実行
npm run test:backend
npm run test:frontend
```

## コア型定義

### Coordinates
位置情報を表現する基本的な型

### HazardInfo
ハザードマップ情報を表現する型

### Shelter
避難所情報を表現する型

### DisasterEvent
過去の災害イベント情報を表現する型

### WeatherAlert
気象警報情報を表現する型

## ハザードマップREST API仕様

### 概要
ハザードマップ情報を取得するための外部REST APIを使用します。バックエンドサービスは環境変数で指定されたAPIエンドポイントに対してHTTP GETリクエストを送信し、指定座標の災害リスク情報を取得します。

### 環境変数設定
```bash
# APIエンドポイントURL（必須）
HAZARD_MAP_API_URL=http://localhost:3001/api/hazard

# APIタイムアウト時間（ミリ秒、デフォルト: 10000）
HAZARD_MAP_API_TIMEOUT=10000

# APIキー（オプション、設定時はBearerトークンとして送信）
HAZARD_MAP_API_KEY=your_api_key_here
```

### APIリクエスト形式
```
GET {HAZARD_MAP_API_URL}?lat={緯度}&lon={経度}
```

**パラメータ:**
- `lat`: 緯度（数値）
- `lon`: 経度（数値）

**例:**
```
GET http://localhost:3001/api/hazard?lat=34.681651&lon=133.896602
```

### APIレスポンス形式
```json
{
  "coordinates": {
    "latitude": 34.681651,
    "longitude": 133.896602
  },
  "source": "座標: 34.681651, 133.896602",
  "input_type": "latlon",
  "hazard_info": {
    "jshis_prob_50": {
      "max_prob": 0.720302,
      "center_prob": 0.720302
    },
    "jshis_prob_60": {
      "max_prob": 0.064867,
      "center_prob": 0.064867
    },
    "inundation_depth": {
      "max_info": "3m以上5m未満",
      "center_info": "3m以上5m未満"
    },
    "tsunami_inundation": {
      "max_info": "浸水想定なし",
      "center_info": "浸水想定なし"
    },
    "hightide_inundation": {
      "max_info": "浸水想定なし",
      "center_info": "浸水想定なし"
    },
    "large_fill_land": {
      "max_info": "情報なし",
      "center_info": "情報なし"
    },
    "landslide_hazard": {
      "debris_flow": {
        "max_info": "該当なし",
        "center_info": "該当なし"
      },
      "steep_slope": {
        "max_info": "該当なし",
        "center_info": "該当なし"
      },
      "landslide": {
        "max_info": "該当なし",
        "center_info": "該当なし"
      }
    }
  },
  "status": "success"
}
```

### 災害情報マッピング
APIレスポンスから以下の災害情報が抽出されます：

#### 地震リスク (`jshis_prob_50`)
- J-SHIS 50年確率から4段階でリスクレベルを判定
- 確率0.8以上: very_high
- 確率0.6以上: high  
- 確率0.3以上: medium
- それ以下: 除外

#### 洪水リスク (`inundation_depth`)
- 浸水深情報からリスクレベルを判定
- 「5m以上」等: very_high
- 「3m以上5m未満」等: high
- 「1m以上3m未満」等: medium
- 「浸水想定なし」: 除外

#### 津波リスク (`tsunami_inundation`)
- 津波浸水情報からリスクレベルを判定
- 「浸水想定なし」「情報なし」: 除外（内陸部で津波リスクが誤表示されることを防止）
- 浸水深に応じてvery_high/high/mediumを判定

#### 大規模盛土造成地リスク (`large_fill_land`)
- 「情報なし」「該当なし」: 除外
- 「警戒」「危険」含む: high
- 「注意」含む: medium

#### 土砂災害リスク (`landslide_hazard`)
- 土石流、急傾斜地、地すべりを統合して判定
- 「該当なし」でない場合にリスクありと判定
- 「特別警戒区域」: very_high
- 「警戒区域」: high
- その他: medium

## 技術スタック

- **フロントエンド**: React 18, TypeScript, Vite
- **バックエンド**: Node.js, Express, TypeScript
- **データベース**: SQLite (キャッシュ用)
- **テスト**: Jest (バックエンド), Vitest (フロントエンド)
- **開発ツール**: ts-node-dev, concurrently

## 外部依存関係

- **外部ハザード情報REST API**: `HAZARD_MAP_API_URL`で指定されるAPI（リポジトリ: https://github.com/shaitkenfront/hazardinfo-restapi）