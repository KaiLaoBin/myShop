<template>
  <div class="home">
    <Navbar />
    <HeroBanner title="Creative" />

    <main class="cart-page">
      <div v-if="!cart.storageAvailable" class="storage-alert">
        <strong>提醒：</strong>
        瀏覽器目前無法儲存購物車資料，離開頁面後將遺失內容。請啟用本地儲存或換用其他瀏覽器。
      </div>
      <section v-if="cart.items.length === 0" class="empty-state">
        <div class="empty-icon">🛒</div>
        <h2>購物車還是空的</h2>
        <p>來去逛逛，挑選喜歡的商品吧！</p>
        <button class="primary" @click="continueShopping">繼續購物</button>
      </section>

      <section v-else class="cart-content">
        <div class="cart-items">
          <div class="cart-header">
            <label class="select-all">
              <input
                type="checkbox"
                :checked="allSelected"
                @change="toggleSelectAll($event.target.checked)"
              />
              全選
            </label>
            <button
              class="link-btn"
              :disabled="selectedIds.length === 0"
              @click="handleBatchRemove"
            >
              移除選擇項目
            </button>
          </div>

          <ul class="item-list">
            <li v-for="item in cart.items" :key="item.id" class="item-card">
              <div class="item-select">
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(item.id)"
                  @change="toggleSelection(item.id, $event.target.checked)"
                />
              </div>
              <div
                class="item-thumb"
                @click="goToProduct(item.id)"
                role="button"
                tabindex="0"
              >
                <div
                  class="thumb-img"
                  :style="{
                    backgroundImage: item.image ? `url(${item.image})` : 'none',
                  }"
                >
                  <span v-if="!item.image" class="thumb-placeholder"
                    >No Image</span
                  >
                </div>
              </div>
              <div class="item-info" :class="{ disabled: item.unavailable }">
                <h3 class="item-name" @click="goToProduct(item.id)">
                  {{ item.name }}
                </h3>
                <p class="item-sku">
                  尺寸：{{ item.size || "F" }} / 顏色：{{ item.color || "—" }}
                </p>
                <p class="item-price">NT$ {{ item.price.toLocaleString() }}</p>
                <p class="item-warning" v-if="item.unavailable">
                  此商品已下架，請移除或改選其他商品。
                </p>
                <p
                  class="item-warning"
                  v-else-if="item.stock != null && item.quantity > item.stock"
                >
                  庫存不足，只剩 {{ item.stock }} 件。
                </p>
                <p class="item-warning price-change" v-if="item.priceChanged">
                  此商品價格已變動（原價 NT$
                  {{ item.previousPrice.toLocaleString() }}）
                  <button
                    class="link-btn small"
                    @click="acknowledgePrice(item)"
                  >
                    我知道了
                  </button>
                </p>
              </div>
              <div class="item-quantity">
                <div class="qty-control">
                  <button
                    @click="decreaseQuantity(item)"
                    :disabled="item.quantity <= 1 || item.unavailable"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="1"
                    :max="item.stock ?? undefined"
                    v-model.number="quantityDrafts[item.id]"
                    @change="commitQuantity(item)"
                    @blur="commitQuantity(item)"
                    :disabled="item.unavailable"
                  />
                  <button
                    @click="increaseQuantity(item)"
                    :disabled="item.unavailable"
                  >
                    ＋
                  </button>
                </div>
                <p class="stock-hint" v-if="item.stock != null">
                  庫存：{{ item.stock }}
                </p>
              </div>
              <div class="item-subtotal">
                <span v-if="item.unavailable">—</span>
                <span v-else
                  >NT$ {{ cart.itemSubtotal(item.id).toLocaleString() }}</span
                >
              </div>
              <div class="item-remove">
                <button class="link-btn" @click="confirmRemove(item)">
                  移除
                </button>
              </div>
            </li>
          </ul>
        </div>

        <aside class="cart-summary">
          <h2>訂單摘要</h2>
          <div class="summary-row">
            <span>商品數量</span>
            <span>{{ totalQuantity }} 件</span>
          </div>
          <div class="summary-row">
            <span>商品小計</span>
            <span>NT$ {{ subtotal.toLocaleString() }}</span>
          </div>
          <div class="summary-row">
            <span>運費</span>
            <span>
              <template v-if="shippingFee === 0">免運</template>
              <template v-else>NT$ {{ shippingFee.toLocaleString() }}</template>
            </span>
          </div>
          <p class="free-shipping-hint" v-if="shippingFee > 0">
            再買 NT$ {{ freeShippingGap.toLocaleString() }} 即可免運
          </p>
          <div class="summary-total">
            <span>應付總額</span>
            <span>NT$ {{ total.toLocaleString() }}</span>
          </div>
          <button
            class="checkout-btn"
            :disabled="cart.items.length === 0"
            @click="goToCheckout"
          >
            前往結帳
          </button>
          <button class="ghost-btn" @click="continueShopping">繼續購物</button>
        </aside>
      </section>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { reactive, computed, watch, ref } from "vue";
import { useRouter } from "vue-router";
import Navbar from "../components/Navbar.vue";
import HeroBanner from "../components/HeroBanner.vue";
import Footer from "../components/Footer.vue";
import { useCartStore } from "../stores/cartStore";

const router = useRouter();
const cart = useCartStore();

const selectedIds = ref([]);
const quantityDrafts = reactive({});

const subtotal = computed(() => cart.subtotal);
const totalQuantity = computed(() => cart.totalQuantity);
const shippingFee = computed(() =>
  subtotal.value >= 2000 || subtotal.value === 0 ? 0 : 100
);
const total = computed(() => subtotal.value + shippingFee.value);
const freeShippingGap = computed(() => Math.max(0, 2000 - subtotal.value));
const allSelected = computed(
  () => cart.items.length > 0 && selectedIds.value.length === cart.items.length
);

watch(
  () => cart.items,
  (items) => {
    const existingIds = new Set(items.map((i) => i.id));
    Object.keys(quantityDrafts).forEach((id) => {
      if (!existingIds.has(Number(id))) {
        delete quantityDrafts[id];
      }
    });
    items.forEach((item) => {
      quantityDrafts[item.id] = item.quantity;
    });
    selectedIds.value = selectedIds.value.filter((id) => existingIds.has(id));
  },
  { deep: true, immediate: true }
);

function toggleSelection(id, checked) {
  if (checked) {
    if (!selectedIds.value.includes(id)) {
      selectedIds.value = [...selectedIds.value, id];
    }
  } else {
    selectedIds.value = selectedIds.value.filter((existing) => existing !== id);
  }
}

function toggleSelectAll(checked) {
  if (checked) {
    selectedIds.value = cart.items.map((item) => item.id);
  } else {
    selectedIds.value = [];
  }
}

function confirmRemove(item) {
  if (window.confirm(`確定要移除「${item.name}」嗎？`)) {
    cart.removeItem(item.id);
  }
}

function handleBatchRemove() {
  if (selectedIds.value.length === 0) return;
  if (
    window.confirm(`確定要移除選擇的 ${selectedIds.value.length} 項商品嗎？`)
  ) {
    selectedIds.value.forEach((id) => cart.removeItem(id));
    selectedIds.value = [];
  }
}

function increaseQuantity(item) {
  if (item.unavailable) return;
  try {
    cart.addItem(item, 1);
  } catch (err) {
    window.alert(err?.message || "更新數量失敗");
  }
}

function decreaseQuantity(item) {
  if (item.quantity <= 1 || item.unavailable) return;
  try {
    cart.decreaseItem(item.id, 1);
  } catch (err) {
    window.alert(err?.message || "更新數量失敗");
  }
}

function commitQuantity(item) {
  if (item.unavailable) {
    quantityDrafts[item.id] = item.quantity;
    return;
  }
  const draft = Number(quantityDrafts[item.id]);
  if (!Number.isFinite(draft) || draft <= 0 || !Number.isInteger(draft)) {
    quantityDrafts[item.id] = item.quantity;
    return;
  }
  if (item.stock != null && draft > item.stock) {
    window.alert("超過庫存，請重新輸入");
    quantityDrafts[item.id] = item.quantity;
    return;
  }
  try {
    cart.updateQuantity(item.id, draft);
  } catch (err) {
    window.alert(err?.message || "更新數量失敗");
    quantityDrafts[item.id] = item.quantity;
  }
}

function acknowledgePrice(item) {
  cart.acknowledgePriceChange(item.id);
}

function goToProduct(id) {
  router.push(`/product/${id}`);
}

function goToCheckout() {
  if (router.hasRoute("Checkout")) {
    router.push({ name: "Checkout" });
  } else {
    router.push("/all-items");
  }
}

function continueShopping() {
  router.push("/all-items");
}
</script>

<style scoped>
.cart-page {
  max-width: 1100px;
  margin: 40px auto;
  padding: 0 16px 60px;
}
.storage-alert {
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #fff4e5;
  border: 1px solid #ffd19a;
  color: #b05903;
  border-radius: 8px;
  font-size: 14px;
}
.empty-state {
  text-align: center;
  padding: 80px 0;
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.primary {
  padding: 12px 24px;
  border: none;
  background: #111;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.cart-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}
.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #eee;
}
.select-all {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}
.link-btn {
  border: none;
  background: none;
  color: #444;
  cursor: pointer;
}
.link-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.item-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-card {
  display: grid;
  grid-template-columns: auto 80px 1fr 160px 120px 80px;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 10px;
  background: #fff;
}
.item-thumb {
  cursor: pointer;
}
.thumb-img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  background: #f5f5f5 center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-placeholder {
  font-size: 12px;
  color: #999;
}
.item-info {
  cursor: default;
}
.item-info.disabled {
  opacity: 0.6;
}
.item-name {
  margin: 0 0 4px;
  font-size: 16px;
  color: #111;
  cursor: pointer;
}
.item-sku {
  margin: 0 0 6px;
  font-size: 13px;
  color: #666;
}
.item-price {
  margin: 0;
  font-size: 14px;
  color: #111;
}
.qty-control {
  display: flex;
  align-items: center;
  gap: 8px;
}
.qty-control button {
  width: 32px;
  height: 32px;
  border: 1px solid #ccc;
  background: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.qty-control input {
  width: 60px;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 6px;
  text-align: center;
}
.stock-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #888;
}
.item-subtotal {
  font-weight: 600;
  color: #111;
}
.item-subtotal span {
  display: inline-block;
}
.item-remove {
  display: flex;
  justify-content: flex-end;
}
.item-warning {
  margin: 6px 0 0;
  font-size: 12px;
  color: #c03d18;
}
.item-warning.price-change {
  color: #8a3ffc;
}
.item-warning .link-btn.small {
  font-size: 12px;
  margin-left: 4px;
  color: #8a3ffc;
}
.cart-summary {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 24px;
  background: #fff;
  height: fit-content;
  position: sticky;
  top: 100px;
}
.cart-summary h2 {
  margin: 0 0 16px;
}
.summary-row,
.summary-total {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 14px;
  color: #333;
}
.summary-total {
  font-size: 18px;
  font-weight: 600;
  margin-top: 18px;
}
.free-shipping-hint {
  font-size: 13px;
  color: #c56124;
  margin: 4px 0 0;
}
.checkout-btn {
  width: 100%;
  padding: 14px 0;
  border: none;
  background: #111;
  color: #fff;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 12px;
}
.checkout-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ghost-btn {
  width: 100%;
  padding: 12px 0;
  border: 1px solid #ddd;
  background: #fff;
  color: #333;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 8px;
}

@media (max-width: 1024px) {
  .cart-content {
    grid-template-columns: 1fr;
  }
  .cart-summary {
    position: static;
  }
  .item-card {
    grid-template-columns: auto 70px 1fr;
    grid-template-areas:
      "select thumb info"
      "select thumb qty"
      "select thumb subtotal"
      "select thumb remove";
    gap: 12px;
  }
  .item-select {
    grid-area: select;
  }
  .item-thumb {
    grid-area: thumb;
  }
  .item-info {
    grid-area: info;
  }
  .item-quantity {
    grid-area: qty;
  }
  .item-subtotal {
    grid-area: subtotal;
  }
  .item-remove {
    grid-area: remove;
    justify-content: flex-start;
  }
}
</style>
