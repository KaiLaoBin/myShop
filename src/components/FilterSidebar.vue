<template>
  <aside class="filter-sidebar">
    <!-- 類別篩選 -->
    <div class="filter-block">
      <h3 class="filter-title">類別</h3>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.categories" value="tops" />
        上衣
      </label>
      <label class="filter-option">
        <input type="checkbox" v-model="filters.categories" value="bottoms" />
        褲子
      </label>
      <label class="filter-option">
        <input
          type="checkbox"
          v-model="filters.categories"
          value="accessories"
        />
        配件
      </label>
    </div>

    <!-- 顏色篩選 -->
    <div class="filter-block">
      <h3 class="filter-title">顏色</h3>
      <div class="color-picker">
        <div
          v-for="color in colors"
          :key="color.value"
          class="color-dot"
          :style="{ backgroundColor: color.hex }"
          @click="toggleColor(color.value)"
        ></div>
      </div>
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
import { reactive } from "vue";

const filters = reactive({
  categories: [],
  colors: [],
  priceRanges: [],
});

const colors = [
  { value: "black", hex: "#000000" },
  { value: "white", hex: "#FFFFFF" },
  { value: "red", hex: "#FF0000" },
  { value: "blue", hex: "#0000FF" },
  { value: "green", hex: "#00FF00" },
];

const toggleColor = (color) => {
  const index = filters.colors.indexOf(color);
  if (index > -1) {
    filters.colors.splice(index, 1);
  } else {
    filters.colors.push(color);
  }
};

// emit 篩選條件給父組件
const emit = defineEmits(["filterChange"]);
</script>
