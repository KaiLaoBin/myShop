<template>
  <div class="all-items">
    <Navbar />
    <HeroBanner title="循環卡圖" />

    <main class="main-section">
      <div class="content-wrapper">
        <FilterSidebar @filterChange="handleFilterChange" />

        <div class="product-section">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>

      <div class="pagination-info">
        <span class="page-code">1, 2, 3 ... 10</span>
        <span class="page-code">0025</span>
      </div>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Navbar from "../components/Navbar.vue";
import HeroBanner from "../components/HeroBanner.vue";
import FilterSidebar from "../components/FilterSidebar.vue";
import ProductCard from "../components/ProductCard.vue";
import Footer from "../components/Footer.vue";

const products = ref([]);

onMounted(async () => {
  // 之後從 mock JSON 載入
  products.value = [
    { id: 1, name: "商品名稱 1", price: 1290, image: "" },
    { id: 2, name: "商品名稱 2", price: 1590, image: "" },
    { id: 3, name: "商品名稱 3", price: 890, image: "" },
    { id: 4, name: "商品名稱 4", price: 1990, image: "" },
    { id: 5, name: "商品名稱 5", price: 1290, image: "" },
    { id: 6, name: "商品名稱 6", price: 2290, image: "" },
    { id: 7, name: "商品名稱 7", price: 1490, image: "" },
    { id: 8, name: "商品名稱 8", price: 1790, image: "" },
  ];
});

const handleFilterChange = (filters) => {
  console.log("篩選條件變更:", filters);
  // 之後可以根據篩選條件過濾商品
};
</script>
