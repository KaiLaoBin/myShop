import { defineStore } from "pinia";
import { getCart, saveCart, syncCart, CartApiError } from "../api/cartApi";
import { isAuthenticated } from "../utils/auth";

/**
 * 驗證數量是否為正整數
 * @param {number} quantity - 數量
 * @throws {Error} 當數量不是正整數時
 */
function ensureValidQuantity(quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0) {
    throw new Error("數量必須為正整數");
  }
}

/**
 * 計算折扣後的價格
 * @param {number} price - 原價
 * @param {number} discountPercent - 折扣百分比 (0-100)
 * @returns {number} 折扣後的價格（四捨五入）
 */
function calculateDiscountedPrice(price, discountPercent) {
  const clampedDiscount = Math.min(Math.max(discountPercent || 0, 0), 100);
  return Math.round(price * (1 - clampedDiscount / 100));
}

/**
 * 標準化商品資料格式，確保必要欄位存在
 * @param {Object} productLike - 商品資料
 * @returns {Object} 標準化的購物車商品
 * @throws {Error} 當必要欄位缺失或格式錯誤時
 */
function coerceCartItemPayload(productLike) {
  if (!productLike || typeof productLike !== "object") {
    throw new Error("商品資料格式錯誤");
  }

  const {
    id,
    name,
    price,
    image = "",
    stock = null,
    discountPercent = 0,
    size = null,
    color = null,
    isActive = true,
  } = productLike;

  // 更嚴格的驗證
  if (id == null || name == null || price == null) {
    throw new Error("商品資料不完整：需要 id, name, price");
  }

  if (typeof price !== "number" || price < 0) {
    throw new Error("商品價格必須為非負數");
  }

  return {
    id,
    name,
    price,
    image,
    stock,
    discountPercent,
    size,
    color,
    isActive,
  };
}

/**
 * 確保從持久化儲存讀取的資料有預設值
 * @param {Array} items - 購物車項目陣列
 * @returns {Array} 標準化後的購物車項目陣列
 */
function normalizePersistedItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    ...item,
    quantity: item.quantity ?? 1,
    discountPercent: item.discountPercent ?? 0,
    previousPrice: item.previousPrice ?? item.price ?? 0,
    priceChanged: Boolean(item.priceChanged),
    unavailable: Boolean(item.unavailable),
  }));
}

// 簡單初始化：移除 localStorage 直接存取，保持 API 抽象層一致性
// 實際資料載入應在應用啟動時透過 loadCart() 進行
const initialItems = [];

// Debounce timer 追蹤（模組級別）
let persistTimer = null;

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: initialItems, // [{ id, name, price, image, stock, discountPercent, quantity, size, color, previousPrice, priceChanged, unavailable }]
    storageAvailable: true,
    isLoading: false, // 載入狀態
    lastError: null, // 最後一次錯誤
  }),

  getters: {
    /**
     * 計算單一商品小計（已套用折扣）
     * @param {Object} state - Store state
     * @returns {Function} 接受 productId 的函數，回傳該商品小計
     */
    itemSubtotal: (state) => (productId) => {
      const item = state.items.find((i) => i.id === productId);
      if (!item) return 0;
      return calculateDiscountedPrice(item.price, item.discountPercent) * item.quantity;
    },

    /**
     * 購物車商品總數（for 導覽列角標）
     * @param {Object} state - Store state
     * @returns {number} 總數量
     */
    totalQuantity: (state) =>
      state.items.reduce((sum, item) => sum + item.quantity, 0),

    /**
     * 訂單小計（所有項目相加，已套用折扣）
     * @param {Object} state - Store state
     * @returns {number} 訂單小計
     */
    subtotal: (state) =>
      state.items.reduce(
        (sum, item) =>
          sum +
          calculateDiscountedPrice(item.price, item.discountPercent) *
            item.quantity,
        0
      ),

    /**
     * 訂單總計（可擴充為含運費、優惠券等）
     * @returns {number} 訂單總計
     */
    total() {
      // 目前與 subtotal 相同，保留未來計算欄位
      return this.subtotal;
    },
  },

  actions: {
    /**
     * 內部方法：實際執行持久化
     * @private
     * @returns {Promise<void>}
     */
    async _doPersist() {
      try {
        const isGuest = !isAuthenticated();
        const result = await saveCart(this.items, isGuest);
        this.storageAvailable = result.storageAvailable;
        // 注意：不覆蓋 items，避免保存過程中用戶修改購物車造成的競態條件
        // 如果 API 回傳更新後的資料，應該在特定場景下才使用（如 syncWithServer）
      } catch (err) {
        if (err instanceof CartApiError) {
          console.error("購物車 API 錯誤", err.code, err.message);
          if (err.code === "STORAGE_QUOTA_EXCEEDED") {
            this.storageAvailable = false;
          }
        } else {
          console.error("購物車資料寫入失敗", err);
          this.storageAvailable = false;
        }
        throw err; // 讓呼叫者知道錯誤
      }
    },

    /**
     * 持久化購物車資料（支援 debounce 與可選的 await）
     * @param {Object} options - 選項
     * @param {boolean} options.immediate - 是否立即執行（不 debounce）
     * @param {number} options.debounceMs - Debounce 延遲時間（毫秒）
     * @returns {Promise<void>} 當 immediate=true 時回傳 Promise
     */
    persist(options = { immediate: false, debounceMs: 300 }) {
      // 清除之前的 timer
      if (persistTimer) {
        clearTimeout(persistTimer);
        persistTimer = null;
      }

      if (options.immediate) {
        return this._doPersist();
      }

      // Debounce 模式：回傳 Promise，但不會阻塞調用者
      return new Promise((resolve, reject) => {
        persistTimer = setTimeout(async () => {
          try {
            await this._doPersist();
            resolve();
          } catch (err) {
            reject(err);
          } finally {
            persistTimer = null;
          }
        }, options.debounceMs);
      });
    },

    /**
     * 新增商品到購物車：若存在則增加數量
     * @param {Object} productLike - 商品資料
     * @param {number} quantity - 數量（預設 1）
     * @returns {Object} 操作結果 { success: boolean, message?: string }
     */
    addItem(productLike, quantity = 1) {
      ensureValidQuantity(quantity);
      const normalized = coerceCartItemPayload(productLike);

      if (normalized.isActive === false) {
        throw new Error("此商品已下架，無法加入購物車");
      }

      const existingIndex = this.items.findIndex(
        (i) => i.id === normalized.id
      );
      const targetQuantity =
        (existingIndex !== -1 ? this.items[existingIndex].quantity : 0) +
        quantity;

      if (normalized.stock != null && targetQuantity > normalized.stock) {
        throw new Error("數量超過庫存");
      }

      // 使用 $patch 批次更新（Pinia 最佳實踐）
      this.$patch((state) => {
        if (existingIndex !== -1) {
          const existing = state.items[existingIndex];
          if (existing.price !== normalized.price) {
            existing.previousPrice = existing.price;
            existing.priceChanged = true;
          }
          existing.quantity = targetQuantity;
          existing.price = normalized.price;
          existing.discountPercent = normalized.discountPercent || 0;
          existing.image = normalized.image || existing.image;
          existing.name = normalized.name || existing.name;
          existing.stock = normalized.stock;
          if (normalized.size) existing.size = normalized.size;
          if (normalized.color) existing.color = normalized.color;
          existing.unavailable = false;
        } else {
          state.items.push({
            ...normalized,
            quantity,
            previousPrice: normalized.price,
            priceChanged: false,
            unavailable: false,
          });
        }
      });

      this.persist();
      return { success: true };
    },

    /**
     * 減少商品數量（預設 -1），減到 0 則移除
     * @param {string|number} productId - 商品 ID
     * @param {number} quantity - 減少數量（預設 1）
     * @returns {Object} 操作結果 { success: boolean, removed: boolean }
     */
    decreaseItem(productId, quantity = 1) {
      ensureValidQuantity(quantity);
      const idx = this.items.findIndex((i) => i.id === productId);
      if (idx === -1) {
        return { success: false, removed: false };
      }

      const next = this.items[idx].quantity - quantity;
      const removed = next <= 0;

      this.$patch((state) => {
        if (removed) {
          state.items.splice(idx, 1);
        } else {
          state.items[idx].quantity = next;
        }
      });

      this.persist();
      return { success: true, removed };
    },

    /**
     * 完全移除商品
     * @param {string|number} productId - 商品 ID
     * @returns {Object} 操作結果 { success: boolean, removed: boolean }
     */
    removeItem(productId) {
      const beforeLen = this.items.length;
      this.$patch((state) => {
        state.items = state.items.filter((i) => i.id !== productId);
      });

      const removed = this.items.length !== beforeLen;
      if (removed) {
        this.persist();
      }
      return { success: removed, removed };
    },

    /**
     * 直接設定商品數量（含驗證與庫存檢查）
     * @param {string|number} productId - 商品 ID
     * @param {number} quantity - 新數量
     * @returns {Object} 操作結果 { success: boolean }
     */
    updateQuantity(productId, quantity) {
      ensureValidQuantity(quantity);
      const item = this.items.find((i) => i.id === productId);
      if (!item) {
        return { success: false };
      }
      if (item.unavailable) {
        throw new Error("此商品已下架，無法調整數量");
      }
      if (item.stock != null && quantity > item.stock) {
        throw new Error("數量超過庫存");
      }

      this.$patch((state) => {
        const targetItem = state.items.find((i) => i.id === productId);
        if (targetItem) {
          targetItem.quantity = quantity;
        }
      });

      this.persist();
      return { success: true };
    },

    /**
     * 清空購物車
     * @returns {Object} 操作結果 { success: boolean }
     */
    clearCart() {
      this.$patch((state) => {
        state.items = [];
      });
      this.persist();
      return { success: true };
    },

    /**
     * 批次同步價格/折扣/庫存（例如定期從後端更新）
     * @param {Array} updates - 更新資料陣列 [{ id, price?, discountPercent?, stock?, isActive? }]
     * @returns {Object} 更新統計 { updated: number, priceChanged: number, unavailable: number }
     */
    syncPricingAndStock(updates) {
      if (!Array.isArray(updates)) {
        return { updated: 0, priceChanged: 0, unavailable: 0 };
      }

      const map = new Map(updates.map((u) => [u.id, u]));
      let stats = { updated: 0, priceChanged: 0, unavailable: 0 };

      this.$patch((state) => {
        state.items = state.items.map((item) => {
          const u = map.get(item.id);
          if (!u) return item;

          stats.updated++;
          const next = { ...item };

          if (u.price != null && u.price !== item.price) {
            next.previousPrice = item.price;
            next.price = u.price;
            next.priceChanged = true;
            stats.priceChanged++;
          } else if (u.price != null) {
            next.price = u.price;
            next.priceChanged = false;
          }

          if (u.discountPercent != null) {
            next.discountPercent = Math.min(
              Math.max(u.discountPercent, 0),
              100
            );
          }

          if (u.stock != null) {
            next.stock = u.stock;
            if (u.stock <= 0) {
              next.unavailable = true;
              stats.unavailable++;
            } else if (next.quantity > u.stock) {
              next.quantity = u.stock;
            }
          }

          if (u.isActive === false) {
            next.unavailable = true;
            stats.unavailable++;
          } else if (u.isActive === true) {
            next.unavailable = false;
          }

          return next;
        });
      });

      this.persist();
      return stats;
    },

    /**
     * 確認價格變更（清除 priceChanged 標記）
     * @param {string|number} productId - 商品 ID
     * @returns {Object} 操作結果 { success: boolean }
     */
    acknowledgePriceChange(productId) {
      const item = this.items.find((i) => i.id === productId);
      if (!item) {
        return { success: false };
      }

      this.$patch((state) => {
        const targetItem = state.items.find((i) => i.id === productId);
        if (targetItem) {
          targetItem.priceChanged = false;
        }
      });

      this.persist();
      return { success: true };
    },

    /**
     * 標記商品為不可用
     * @param {string|number} productId - 商品 ID
     * @returns {Object} 操作結果 { success: boolean }
     */
    markUnavailable(productId) {
      const item = this.items.find((i) => i.id === productId);
      if (!item) {
        return { success: false };
      }

      this.$patch((state) => {
        const targetItem = state.items.find((i) => i.id === productId);
        if (targetItem) {
          targetItem.unavailable = true;
        }
      });

      this.persist();
      return { success: true };
    },

    /**
     * 同步購物車（登入時使用）
     * @param {Array} serverItems - 從伺服器取得的購物車項目
     * @returns {Promise<Object>} 操作結果 { success: boolean, items?: Array }
     * @throws {Error} 當同步失敗時
     */
    async syncWithServer(serverItems = []) {
      this.isLoading = true;
      this.lastError = null;

      try {
        const isGuest = !isAuthenticated();
        const localItems = this.items;
        const result = await syncCart(localItems, serverItems);

        this.$patch({
          items: normalizePersistedItems(result.items),
          storageAvailable: result.storageAvailable,
          isLoading: false,
        });

        // 同步後立即保存（確保資料已寫入）
        await this.persist({ immediate: true });

        return { success: true, items: result.items };
      } catch (err) {
        this.isLoading = false;
        this.lastError = err;

        if (err instanceof CartApiError) {
          console.error("同步購物車失敗", err.code, err.message);
        } else {
          console.error("同步購物車時發生錯誤", err);
        }

        // 同步失敗時，保留本地購物車
        throw err; // 讓 UI 能捕捉錯誤
      }
    },

    /**
     * 載入購物車（從 API 重新讀取）
     * @returns {Promise<Object>} 操作結果 { success: boolean, items?: Array }
     * @throws {Error} 當載入失敗時
     */
    async loadCart() {
      this.isLoading = true;
      this.lastError = null;

      try {
        const isGuest = !isAuthenticated();
        const result = await getCart(isGuest);

        this.$patch({
          items: normalizePersistedItems(result.items),
          storageAvailable: result.storageAvailable,
          isLoading: false,
        });

        return { success: true, items: result.items };
      } catch (err) {
        this.isLoading = false;
        this.lastError = err;

        if (err instanceof CartApiError) {
          console.error("載入購物車失敗", err.code, err.message);
        } else {
          console.error("載入購物車時發生錯誤", err);
        }

        throw err; // 讓 UI 能捕捉錯誤
      }
    },
  },
});

// 自動持久化：pinia 在組件內使用該 store 時，第一次實例化後會執行
// 另外也可以在 main.js 建立 pinia 後，使用 useCartStore().$subscribe，但此處在 action 中已 persist
