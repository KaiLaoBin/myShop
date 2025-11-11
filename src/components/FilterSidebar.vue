<template>
  <aside class="filter-sidebar">
    <!-- 價格排序 -->
    <div class="filter-block">
      <h3 class="filter-title">價格排序</h3>
      <select v-model="filters.sortBy" class="filter-select">
        <option value="">預設</option>
        <option value="price-asc">價格由低到高</option>
        <option value="price-desc">價格由高到低</option>
      </select>
    </div>

    <!-- 類別篩選 -->
    <div class="filter-block">
      <h3 class="filter-title">類別</h3>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.categories" value="Tops" />
        上衣
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.categories" value="Bottoms" />
        下身
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.categories" value="Outerwear" />
        外套
      </label>
      <label class="filter-option">
        <input
          type="checkbox"
          v-model="filters.categories"
          value="Accessories"
        />
        配件
      </label>
    </div>

    <!-- 尺寸篩選 -->
    <div class="filter-block">
      <h3 class="filter-title">尺寸</h3>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.sizes" value="S" /> S
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.sizes" value="M" /> M
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.sizes" value="L" /> L
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.sizes" value="XL" /> XL
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.sizes" value="F" /> F
      </label>
    </div>

    <!-- 價格篩選 -->
    <div class="filter-block">
      <h3 class="filter-title">價格區間</h3>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.priceRanges" value="0-1000" />
        NT$ 0 - 1,000
      </label>
      <label class="filter-option">
        <input
          type="checkbox"
          v-model="filters.priceRanges"
          value="1000-2000"
        />
        NT$ 1,000 - 2,000
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.priceRanges" value="2000+" />
        NT$ 2,000+
      </label>
    </div>
  </aside>
</template>

<script setup>
import { reactive, watch } from "vue";

const emit = defineEmits(["filterChange"]);

const filters = reactive({
  categories: [],
  sizes: [],
  priceRanges: [],
  sortBy: "",
});

watch(
  filters,
  (newFilters) => {
    emit("filterChange", newFilters);
  },
  { deep: true }
);
</script>
