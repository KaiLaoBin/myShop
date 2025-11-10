<template>
  <div class="product-card" @click="handleClick">
    <div class="product-img-wrapper">
      <div
        class="product-img"
        :style="{ backgroundImage: `url(${product.image})` }"
      ></div>
    </div>
    <div class="product-details">
      <h3 class="product-name">{{ product.name }}</h3>
      <p class="product-price">NT$ {{ product.price.toLocaleString() }}</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});

const handleClick = () => {
  console.log("點擊商品:", props.product.name);
  // 之後加跳轉到商品頁裡
};
</script>
