# API 抽象層說明

## 購物車 API (`cartApi.js`)

此檔案提供購物車資料的抽象層，目前實作為 localStorage，未來接資料庫時只需修改此檔案。

### 切換到 API 模式

在 `cartApi.js` 中將 `USE_API` 設為 `true`：

```javascript
const USE_API = true; // 切換為 API 模式
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
```

### 錯誤格式

所有錯誤都使用 `CartApiError` 類別，包含：

- `message`: 錯誤訊息
- `code`: 錯誤代碼（如 `OUT_OF_STOCK`, `NETWORK_ERROR`）
- `status`: HTTP 狀態碼
- `details`: 額外資訊

### 同步策略

#### 登入時

1. 從伺服器取得使用者的購物車
2. 合併本地與伺服器購物車（以伺服器為主，保留本地新增項目）
3. 更新 store

#### 登出時

目前實作：保留本地購物車，切換到訪客模式

- 可選：清空訪客購物車（在 `App.vue` 中取消註解 `clearGuestCart()`）

### 未來 API 端點規劃

```
GET    /api/cart              - 取得購物車
PUT    /api/cart              - 更新購物車
POST   /api/cart/sync         - 同步購物車（登入時）
```

### 使用範例

```javascript
import { getCart, saveCart, syncCart, CartApiError } from "./api/cartApi";

// 取得購物車
const { items, storageAvailable } = await getCart(isGuest);

// 儲存購物車
await saveCart(items, isGuest);

// 同步購物車（登入時）
const merged = await syncCart(localItems, serverItems);
```
