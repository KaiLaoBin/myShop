<template>
  <div class="home">
    <Navbar />
    <HeroBanner title="Creative" />

    <main class="detail-container" v-if="state.loaded && state.product">
      <div class="gallery">
        <div class="image-placeholder">
          <!-- 圖片暫留空 -->
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
        </div>
        <div class="description">
          <h2>商品描述</h2>
          <p>{{ state.product.description || "—" }}</p>
        </div>
        <div class="actions">
          <button class="primary" @click="goBack">返回列表</button>
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
import { reactive, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import Navbar from "../components/Navbar.vue";
import HeroBanner from "../components/HeroBanner.vue";
import Footer from "../components/Footer.vue";

const route = useRoute();
const router = useRouter();

const state = reactive({
  loaded: false,
  product: null,
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
    state.product = (data?.products || []).find((p) => Number(p.id) === id) || null;
  } catch (err) {
    console.error("讀取商品失敗:", err);
  } finally {
    state.loaded = true;
  }
}

function goBack() {
  router.push("/all-items");
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