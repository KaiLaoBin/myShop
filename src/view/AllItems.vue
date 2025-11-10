<template>
  <div class="all-items">
    <Navbar />
    <HeroBanner title="Creative" />

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
  try {
    const response = await fetch("/mock/products.json");
    const data = await response.json();
    products.value = data.products;
  } catch (er) {
    console.error("資料抓取錯誤:", er);
  }
});
// filter
const handleFilterChange = (filters) => {
  console.log("篩選條件變更:", filters);
};
</script>
