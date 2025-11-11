<template>
  <router-link :to="`/product/${product.id}`" class="product-card">
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
  </router-link>
</template>

<script setup>
const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
});
</script>
