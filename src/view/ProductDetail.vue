<template>
  <div class="home">
    <Navbar />
    <HeroBanner title="Creative" />

    <main class="detail-container" v-if="state.loaded && state.product">
      <div class="gallery">
        <img
          v-if="state.product.image"
          :src="state.product.image"
          :alt="state.product.name"
          style="
            width: 100%;
            height: auto;
            aspect-ratio: 1 / 1;
            object-fit: cover;
            border-radius: 8px;
            background: #f5f5f5;
          "
        />
        <div v-else class="image-placeholder">
          <!-- 圖片不存在 -->
        </div>
      </div>
      <div class="info">
        <h1 class="title">{{ state.product.name }}</h1>
        <p class="price">NT$ {{ formatPrice(state.product.price) }}</p>
        <div class="meta">
          <div class="meta-row">
            <span class="meta-label">尺寸</span>
            <span class="meta-value">{{ state.product.size || "-" }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">顏色</span>
            <span class="meta-value">{{ state.product.color || "-" }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">分類</span>
            <span class="meta-value">{{ state.product.category || "-" }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">庫存</span>
            <span class="meta-value">
              {{ displayStockText }}
            </span>
          </div>
        </div>
        <div class="description">
          <h2>商品描述</h2>
          <p>{{ state.product.description || "—" }}</p>
        </div>
        <div class="actions">
          <div class="qty-row">
            <label class="qty-label" for="qty">數量</label>
            <input
              id="qty"
              class="qty-input"
              type="number"
              min="1"
              :max="state.product.stock ?? undefined"
              v-model.number="ui.quantity"
            />
            <span class="in-cart-tip" v-if="inCartQuantity > 0">
              已在購物車（數量 {{ inCartQuantity }}）
            </span>
          </div>
          <div class="btn-row">
            <button
              class="primary add-btn"
              :class="{ 'is-adding': ui.isAdding }"
              :disabled="disableAdd"
              @click="handleAddToCart"
            >
              {{ ui.isAdding ? "加入中..." : "加入購物車" }}
            </button>
            <button
              class="secondary buy-now-btn"
              :disabled="disableAdd"
              @click="handleBuyNow"
            >
              立即購買
            </button>
            <button class="ghost" @click="goBack">返回列表</button>
          </div>
          <p v-if="ui.error" class="error-text">{{ ui.error }}</p>
          <div class="toast" v-if="ui.toastVisible">{{ ui.toastMessage }}</div>
        </div>
      </div>
    </main>

    <main class="detail-container" v-else-if="state.loaded && !state.product">
      <div class="not-found">
        <h2>找不到此商品</h2>
        <button class="primary" @click="goBack">返回列表</button>
      </div>
    </main>

    <main class="detail-container" v-else>
      <div class="loading">載入中...</div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { reactive, onMounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCartStore } from "../stores/cartStore";
import Navbar from "../components/Navbar.vue";
import HeroBanner from "../components/HeroBanner.vue";
import Footer from "../components/Footer.vue";

const route = useRoute();
const router = useRouter();
const cart = useCartStore();

const state = reactive({
  loaded: false,
  product: null,
});

const ui = reactive({
  quantity: 1,
  isAdding: false,
  toastVisible: false,
  toastMessage: "",
  error: "",
});

function formatPrice(price) {
  if (typeof price !== "number") return price;
  return price.toLocaleString();
}

async function loadProduct() {
  state.loaded = false;
  state.product = null;
  try {
    const response = await fetch("/mock/products.json");
    const data = await response.json();
    const id = Number(route.params.id);
    const found =
      (data?.products || []).find((p) => Number(p.id) === id) || null;
    // 預設庫存（mock 無庫存欄位時給一個合理值）
    state.product = found ? { stock: 20, discountPercent: 0, ...found } : null;
    // 重置 UI 狀態
    ui.quantity = 1;
    ui.error = "";
  } catch (err) {
    console.error("讀取商品失敗:", err);
  } finally {
    state.loaded = true;
  }
}

function goBack() {
  router.push("/all-items");
}

const inCartQuantity = computed(() => {
  if (!state.product) return 0;
  const item = cart.items.find((i) => i.id === state.product.id);
  return item?.quantity || 0;
});

const displayStockText = computed(() => {
  if (!state.product) return "-";
  return state.product.stock != null ? `${state.product.stock}` : "—";
});

const disableAdd = computed(() => {
  if (!state.product) return true;
  const q = Number(ui.quantity);
  if (!Number.isFinite(q) || q <= 0 || !Number.isInteger(q)) return true;
  if (
    state.product.stock != null &&
    q + inCartQuantity.value > state.product.stock
  ) {
    return true;
  }
  return ui.isAdding;
});

function showToast(message) {
  ui.toastMessage = message;
  ui.toastVisible = true;
  setTimeout(() => {
    ui.toastVisible = false;
  }, 1600);
}

async function handleAddToCart() {
  ui.error = "";
  ui.isAdding = true;
  try {
    cart.addItem(
      {
        id: state.product.id,
        name: state.product.name,
        price: state.product.price,
        image: state.product.image || "",
        stock: state.product.stock,
        discountPercent: state.product.discountPercent || 0,
        size: state.product.size,
        color: state.product.color,
      },
      ui.quantity
    );
    showToast("已加入購物車");
  } catch (e) {
    ui.error = e?.message || "加入購物車失敗";
  } finally {
    ui.isAdding = false;
  }
}

async function handleBuyNow() {
  try {
    await handleAddToCart();
    // 這裡可導向結帳頁（若未建立 checkout 頁，暫時導向所有商品或保留在此）
    router.push("/all-items");
  } catch {
    // 已在 handleAddToCart 設定錯誤訊息
  }
}

onMounted(loadProduct);
watch(
  () => route.params.id,
  () => loadProduct()
);
</script>

<style scoped>
.detail-container {
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 16px 40px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
}

.gallery .image-placeholder {
  width: 100%;
  padding-top: 100%;
  background: #f5f5f5;
  border: 1px solid #eee;
  border-radius: 8px;
}

.info .title {
  font-size: 28px;
  margin: 0 0 12px;
}

.price {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 20px;
}
.meta-row {
  display: flex;
  gap: 12px;
  font-size: 14px;
}
.meta-label {
  width: 48px;
  color: #666;
}
.meta-value {
  color: #111;
}

.description h2 {
  font-size: 16px;
  margin: 0 0 8px;
}
.description p {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #333;
}

.actions {
  margin-top: 24px;
}
.primary {
  padding: 10px 14px;
  border: none;
  background: #111;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.secondary {
  padding: 10px 14px;
  border: none;
  background: #333;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.ghost {
  padding: 10px 14px;
  border: 1px solid #ddd;
  background: #fff;
  color: #111;
  border-radius: 6px;
  cursor: pointer;
}
.btn-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}
.qty-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
.qty-label {
  color: #666;
  font-size: 14px;
}
.qty-input {
  width: 90px;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
.in-cart-tip {
  font-size: 13px;
  color: #666;
}
.error-text {
  margin-top: 10px;
  color: #c00;
  font-size: 13px;
}
.toast {
  position: fixed;
  left: 50%;
  bottom: 30px;
  transform: translateX(-50%);
  background: rgba(17, 17, 17, 0.95);
  color: #fff;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  animation: fadeInOut 1.6s ease forwards;
}
@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  10% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  90% {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
}
.add-btn.is-adding {
  position: relative;
  overflow: hidden;
}
.add-btn.is-adding::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 1s infinite;
}
@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.not-found,
.loading {
  grid-column: 1 / -1;
  text-align: center;
  padding: 60px 0;
}

@media (max-width: 900px) {
  .detail-container {
    grid-template-columns: 1fr;
  }
}
</style>
