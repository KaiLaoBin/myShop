import { defineStore } from "pinia";

const STORAGE_KEY = "cart_items_v1";

function readPersistedItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return {
      items: raw ? JSON.parse(raw) : [],
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

function ensureValidQuantity(quantity) {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("數量需為正整數");
  }
  if (!Number.isInteger(quantity)) {
    throw new Error("數量需為整數");
  }
}

function coerceCartItemPayload(productLike) {
  // Normalize payload to the minimal required fields for the cart
  const {
    id,
    name,
    price,
    image = "",
    stock = null, // null/undefined means unlimited or unchecked
    discountPercent = 0, // 0-100
    size = null,
    color = null,
    isActive = true,
  } = productLike || {};
  if (id == null || name == null || price == null) {
    throw new Error("商品資料不完整：需要 id, name, price");
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

const { items: persistedItems, storageAvailable: initialStorageAvailable } =
  readPersistedItems();

const initialItems = normalizePersistedItems(persistedItems);

export const useCartStore = defineStore("cart", {
  state: () => ({
    items: initialItems, // [{ id, name, price, image, stock, discountPercent, quantity, size, color, previousPrice, priceChanged, unavailable }]
    storageAvailable: initialStorageAvailable,
  }),
  getters: {
    // 單項目小計（已套用折扣）
    itemSubtotal: (state) => (productId) => {
      const item = state.items.find((i) => i.id === productId);
      if (!item) return 0;
      const discounted =
        item.price *
        (1 - Math.min(Math.max(item.discountPercent || 0, 0), 100) / 100);
      return Math.round(discounted) * item.quantity;
    },

    // 購物車商品總數（for 導覽列角標）
    totalQuantity: (state) =>
      state.items.reduce((sum, item) => sum + item.quantity, 0),

    // 訂單小計（所有項目相加，已套用折扣）
    subtotal: (state) =>
      state.items.reduce((sum, item) => {
        const discounted =
          item.price *
          (1 - Math.min(Math.max(item.discountPercent || 0, 0), 100) / 100);
        return sum + Math.round(discounted) * item.quantity;
      }, 0),

    // 訂單總計（可擴充為含運費、優惠券等）
    total() {
      // 目前與 subtotal 相同，保留未來計算欄位
      return this.subtotal;
    },
  },
  actions: {
    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
        this.storageAvailable = true;
      } catch (err) {
        console.error("購物車資料寫入失敗", err);
        this.storageAvailable = false;
      }
    },

    // 新增商品：若存在則增加數量
    addItem(productLike, quantity = 1) {
      ensureValidQuantity(quantity);
      const normalized = coerceCartItemPayload(productLike);

      if (normalized.isActive === false) {
        throw new Error("此商品已下架，無法加入購物車");
      }

      const existing = this.items.find((i) => i.id === normalized.id);
      const targetQuantity = (existing?.quantity || 0) + quantity;

      if (normalized.stock != null && targetQuantity > normalized.stock) {
        throw new Error("數量超過庫存");
      }

      if (existing) {
        existing.quantity = targetQuantity;
        if (existing.price !== normalized.price) {
          existing.previousPrice = existing.price;
          existing.priceChanged = true;
        }
        existing.price = normalized.price;
        existing.discountPercent = normalized.discountPercent || 0;
        existing.image = normalized.image || existing.image;
        existing.name = normalized.name || existing.name;
        existing.stock = normalized.stock;
        if (normalized.size) existing.size = normalized.size;
        if (normalized.color) existing.color = normalized.color;
        existing.unavailable = false;
      } else {
        this.items.push({
          ...normalized,
          quantity,
          previousPrice: normalized.price,
          priceChanged: false,
          unavailable: false,
        });
      }
      this.persist();
    },

    // 減少數量（預設 -1），減到 0 則移除
    decreaseItem(productId, quantity = 1) {
      ensureValidQuantity(quantity);
      const idx = this.items.findIndex((i) => i.id === productId);
      if (idx === -1) return;
      const next = this.items[idx].quantity - quantity;
      if (next <= 0) {
        this.items.splice(idx, 1);
      } else {
        this.items[idx].quantity = next;
      }
      this.persist();
    },

    // 完全移除商品
    removeItem(productId) {
      const beforeLen = this.items.length;
      this.items = this.items.filter((i) => i.id !== productId);
      if (this.items.length !== beforeLen) {
        this.persist();
      }
    },

    // 直接設定數量（含驗證與庫存檢查）
    updateQuantity(productId, quantity) {
      ensureValidQuantity(quantity);
      const item = this.items.find((i) => i.id === productId);
      if (!item) return;
      if (item.unavailable) {
        throw new Error("此商品已下架，無法調整數量");
      }
      if (item.stock != null && quantity > item.stock) {
        throw new Error("數量超過庫存");
      }
      item.quantity = quantity;
      this.persist();
    },

    // 清空購物車
    clearCart() {
      this.items = [];
      this.persist();
    },

    // 批次同步價格/折扣/庫存（例如定期從後端更新）
    syncPricingAndStock(updates) {
      // updates: Array<{ id, price?, discountPercent?, stock?, isActive? }>
      if (!Array.isArray(updates)) return;
      const map = new Map(updates.map((u) => [u.id, u]));
      this.items = this.items.map((item) => {
        const u = map.get(item.id);
        if (!u) return item;
        const next = { ...item };
        if (u.price != null && u.price !== item.price) {
          next.previousPrice = item.price;
          next.price = u.price;
          next.priceChanged = true;
        } else if (u.price != null) {
          next.price = u.price;
          next.priceChanged = false;
        }
        if (u.discountPercent != null) {
          next.discountPercent = Math.min(Math.max(u.discountPercent, 0), 100);
        }
        if (u.stock != null) {
          next.stock = u.stock;
          if (u.stock <= 0) {
            next.unavailable = true;
          } else if (next.quantity > u.stock) {
            next.quantity = u.stock;
          }
        }
        if (u.isActive === false) {
          next.unavailable = true;
        } else if (u.isActive === true) {
          next.unavailable = false;
        }
        return next;
      });
      this.persist();
    },

    acknowledgePriceChange(productId) {
      const item = this.items.find((i) => i.id === productId);
      if (item) {
        item.priceChanged = false;
        this.persist();
      }
    },

    markUnavailable(productId) {
      const item = this.items.find((i) => i.id === productId);
      if (item) {
        item.unavailable = true;
        this.persist();
      }
    },
  },
});

// 自動持久化：pinia 在組件內使用該 store 時，第一次實例化後會執行
// 另外也可以在 main.js 建立 pinia 後，使用 useCartStore().$subscribe，但此處在 action 中已 persist
