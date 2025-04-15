## Getting Started

First, run the development server:

```bash
npm install
```

編譯成 WASM:

```bash
npm run asbuild
```

## 中型地圖

| 13\*13                         | 13\*21                         |
| ------------------------------ | ------------------------------ |
| <img src="/public/path_1.png"> | <img src="/public/path_2.png"> |
| <img src="/public/path_3.png"> | <img src="/public/path_4.png"> |

|    **WASM 平均執行時間**    | 0\.03 ms |
| :-------------------------: | :------: |
| **TypeScript 平均執行時間** | 2\.88 ms |
|      **效能提升比例**       |   96x    |
