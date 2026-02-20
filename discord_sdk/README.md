# Discord Activity Platform

Discord Embedded App SDK Activity — 在 Discord 內的互動應用。

## Structure

```
discord_sdk/
├── client/          # React + Vite 前端
│   ├── src/
│   │   ├── components/   # UI 元件
│   │   ├── hooks/        # Discord SDK & Socket.io hooks
│   │   └── store/        # Zustand 狀態管理
│   └── index.html
└── server/          # Express + Socket.io 後端
    ├── server.js
    └── services/
        └── activityLogger.js
```

## Development

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Dev mode (from project root)
npm run activity:dev
```

## Build

```bash
cd client && npm run build
```
