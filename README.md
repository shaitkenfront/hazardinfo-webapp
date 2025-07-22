# 災害情報一覧化アプリ

住所、緯度経度、SUUMO URL、現在地などを指定することで、その地域の防災情報を一覧化して表示するWebアプリケーション。

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

## 技術スタック

- **フロントエンド**: React 18, TypeScript, Vite
- **バックエンド**: Node.js, Express, TypeScript
- **データベース**: SQLite (キャッシュ用)
- **テスト**: Jest (バックエンド), Vitest (フロントエンド)
- **開発ツール**: ts-node-dev, concurrently