<template>
  <div class="all-items">
    <Navbar />
    <HeroBanner title="Creative" />

    <main class="main-section">
      <button class="filter-toggle-btn" @click="toggleFilterMenu" title="開啟篩選">
        <svg
          class="filter-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M3 4h18v2H3V4zm2 7h14v2H5v-2zm2 7h10v2H7v-2z" />
        </svg>
      </button>
      <div class="content-wrapper">
        <FilterSidebar
          @filterChange="handleFilterChange"
          :class="{ 'is-open': isFilterMenuOpen }"
          @close="isFilterMenuOpen = false"
        />

        <div class="product-section">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </div>
      <!-- page-code -->
      <!-- <div class="pagination-info">
        <span class="page-code">1, 2, 3 ... 10</span>
        <span class="page-code">0025</span>
      </div> -->
    </main>

    <div
      class="filter-overlay"
      :class="{ 'is-open': isFilterMenuOpen }"
      @click="isFilterMenuOpen = false"
    ></div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import Navbar from "../components/Navbar.vue";
import HeroBanner from "../components/HeroBanner.vue";
import FilterSidebar from "../components/FilterSidebar.vue";
import ProductCard from "../components/ProductCard.vue";
import Footer from "../components/Footer.vue";

const products = ref([]);
const activeFilters = ref({
  categories: [],
  sizes: [],
  priceRanges: [],
  sortBy: "",
});
const isFilterMenuOpen = ref(false);

const toggleFilterMenu = () => {
  isFilterMenuOpen.value = !isFilterMenuOpen.value;
};

onMounted(async () => {
  try {
    const response = await fetch("/mock/products.json");
    const data = await response.json();
    products.value = data.products;
  } catch (er) {
    console.error("資料抓取錯誤:", er);
  }
});

const handleFilterChange = (filters) => {
  activeFilters.value = filters;
};

const filteredProducts = computed(() => {
  let result = [...products.value];

  // 類別篩選
  if (activeFilters.value.categories.length > 0) {
    result = result.filter((p) =>
      activeFilters.value.categories.includes(p.category)
    );
  }

  // 尺寸篩選
  if (activeFilters.value.sizes.length > 0) {
    result = result.filter((p) => activeFilters.value.sizes.includes(p.size));
  }

  // 價格區間篩選
  if (activeFilters.value.priceRanges.length > 0) {
    result = result.filter((p) => {
      return activeFilters.value.priceRanges.some((range) => {
        if (range === "0-1000") return p.price <= 1000;
        if (range === "1000-2000") return p.price > 1000 && p.price <= 2000;
        if (range === "2000+") return p.price > 2000;
        return false;
      });
    });
  }

  // 排序
  if (activeFilters.value.sortBy === "price-asc") {
    result.sort((a, b) => a.price - b.price);
  } else if (activeFilters.value.sortBy === "price-desc") {
    result.sort((a, b) => b.price - a.price);
  }

  return result;
});
</script>
