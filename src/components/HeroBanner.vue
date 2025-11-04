<template>
  <section class="hero-banner">
    <div class="hero-overlay">
      <div class="hero-content">
        <h1 class="hero-title">{{ title }}</h1>
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    default: "Creative",
  },
});
</script>
