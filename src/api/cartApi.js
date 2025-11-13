/**
 * 購物車 API 抽象層
 * 
 * 目前實作：localStorage
 * 未來接資料庫時，只需修改此檔案，將函數改為 API 呼叫
 */

// ==================== 統一錯誤格式 ====================
export class CartApiError extends Error {
  constructor(message, code = "UNKNOWN", status = 500, details = null) {
    super(message);
    this.name = "CartApiError";
    this.code = code; // 錯誤代碼：INVALID_QUANTITY, OUT_OF_STOCK, NOT_FOUND, NETWORK_ERROR, etc.
    this.status = status; // HTTP 狀態碼（未來用）
    this.details = details; // 額外資訊
  }
}

// ==================== 配置 ====================
const STORAGE_KEY = "cart_items_v1";
const STORAGE_KEY_GUEST = "cart_items_guest_v1"; // 訪客購物車（未登入時）

// 是否啟用 API 模式（未來切換為 true 時，改用真實 API）
const USE_API = false;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

// ==================== 輔助函數 ====================
function getStorageKey(isGuest = false) {
  return isGuest ? STORAGE_KEY_GUEST : STORAGE_KEY;
}

function checkStorageAvailable() {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

// ==================== localStorage 實作（目前使用） ====================
async function fetchCartFromStorage(isGuest = false) {
  const storageAvailable = checkStorageAvailable();
  if (!storageAvailable) {
    return {
      items: [],
      storageAvailable: false,
    };
  }

  try {
    const key = getStorageKey(isGuest);
    const raw = localStorage.getItem(key);
    const items = raw ? JSON.parse(raw) : [];
    return {
      items: Array.isArray(items) ? items : [],
      storageAvailable: true,
    };
  } catch (err) {
    console.error("讀取購物車資料失敗", err);
    return {
      items: [],
      storageAvailable: false,
    };
  }
}

async function saveCartToStorage(items, isGuest = false) {
  const storageAvailable = checkStorageAvailable();
  if (!storageAvailable) {
    return { success: false, storageAvailable: false };
  }

  try {
    const key = getStorageKey(isGuest);
    localStorage.setItem(key, JSON.stringify(items));
    return { success: true, storageAvailable: true };
  } catch (err) {
    // 可能是容量不足
    if (err.name === "QuotaExceededError") {
      throw new CartApiError(
        "儲存空間不足，無法儲存購物車",
        "STORAGE_QUOTA_EXCEEDED",
        507
      );
    }
    console.error("寫入購物車資料失敗", err);
    return { success: false, storageAvailable: false };
  }
}

// ==================== API 實作（未來使用） ====================
async function fetchCartFromAPI() {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // 未來加入：Authorization: `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new CartApiError(
        errorData.message || "取得購物車失敗",
        errorData.code || "FETCH_FAILED",
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return {
      items: Array.isArray(data.items) ? data.items : [],
      storageAvailable: true, // API 模式不需要檢查 localStorage
    };
  } catch (err) {
    if (err instanceof CartApiError) throw err;
    throw new CartApiError(
      "網路連線失敗",
      "NETWORK_ERROR",
      0,
      { originalError: err.message }
    );
  }
}

async function saveCartToAPI(items) {
  try {
    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        // 未來加入：Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new CartApiError(
        errorData.message || "儲存購物車失敗",
        errorData.code || "SAVE_FAILED",
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return {
      success: true,
      storageAvailable: true,
      items: data.items || items, // 伺服器可能回傳更新後的資料
    };
  } catch (err) {
    if (err instanceof CartApiError) throw err;
    throw new CartApiError(
      "網路連線失敗",
      "NETWORK_ERROR",
      0,
      { originalError: err.message }
    );
  }
}

async function syncCartToAPI(localItems, serverItems) {
  // 合併策略：以伺服器為主，但保留本地新增的項目
  // 未來可調整為更複雜的合併邏輯
  try {
    const response = await fetch(`${API_BASE_URL}/cart/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        localItems,
        serverItems,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new CartApiError(
        errorData.message || "同步購物車失敗",
        errorData.code || "SYNC_FAILED",
        response.status,
        errorData
      );
    }

    const data = await response.json();
    return {
      items: Array.isArray(data.items) ? data.items : [],
      storageAvailable: true,
    };
  } catch (err) {
    if (err instanceof CartApiError) throw err;
    throw new CartApiError(
      "同步購物車時發生錯誤",
      "SYNC_ERROR",
      0,
      { originalError: err.message }
    );
  }
}

// ==================== 公開 API ====================
/**
 * 取得購物車資料
 * @param {boolean} isGuest - 是否為訪客模式
 * @returns {Promise<{items: Array, storageAvailable: boolean}>}
 */
export async function getCart(isGuest = false) {
  if (USE_API) {
    return await fetchCartFromAPI();
  } else {
    return await fetchCartFromStorage(isGuest);
  }
}

/**
 * 儲存購物車資料
 * @param {Array} items - 購物車項目陣列
 * @param {boolean} isGuest - 是否為訪客模式
 * @returns {Promise<{success: boolean, storageAvailable: boolean, items?: Array}>}
 */
export async function saveCart(items, isGuest = false) {
  if (USE_API) {
    return await saveCartToAPI(items);
  } else {
    return await saveCartToStorage(items, isGuest);
  }
}

/**
 * 同步本地與伺服器購物車（登入時使用）
 * @param {Array} localItems - 本地購物車項目
 * @param {Array} serverItems - 伺服器購物車項目
 * @returns {Promise<{items: Array, storageAvailable: boolean}>}
 */
export async function syncCart(localItems, serverItems) {
  if (USE_API) {
    return await syncCartToAPI(localItems, serverItems);
  } else {
    // localStorage 模式下，直接合併（以本地為主，伺服器為輔）
    // 未來可改為更複雜的合併邏輯
    const merged = [...localItems];
    const localIds = new Set(localItems.map((i) => i.id));
    serverItems.forEach((serverItem) => {
      if (!localIds.has(serverItem.id)) {
        merged.push(serverItem);
      }
    });
    await saveCartToStorage(merged, false);
    return {
      items: merged,
      storageAvailable: true,
    };
  }
}

/**
 * 清空訪客購物車（登出時可選用）
 */
export async function clearGuestCart() {
  try {
    const key = getStorageKey(true);
    localStorage.removeItem(key);
    return { success: true };
  } catch (err) {
    console.error("清空訪客購物車失敗", err);
    return { success: false };
  }
}

/**
 * 檢查儲存可用性
 */
export function checkStorage() {
  return checkStorageAvailable();
}

