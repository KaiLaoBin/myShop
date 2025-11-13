<template>
  <nav class="top-nav">
    <div class="nav-container">
      <router-link to="/" class="brand-logo">MyBrand</router-link>
      <ul class="nav-menu">
        <li>
          <router-link to="/all-items" class="nav-link">所有商品</router-link>
        </li>
        <!-- <li>
          <router-link to="/new" class="nav-link">NEW ARRIVAL</router-link>
        </li>
        <li><router-link to="/sales" class="nav-link">Sales</router-link></li> -->
        <li
          class="cart-wrapper"
          @mouseenter="ui.previewOpen = true"
          @mouseleave="ui.previewOpen = false"
        >
          <button class="cart-button" @click="goToCart" aria-label="購物車">
            <svg
              class="cart-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path
                d="M7 4h-2l-1 2v2h1l3.6 7.59-1.35 2.45c-.27.49-.4 1.04-.4 1.61 0 1.93 1.57 3.5 3.5 3.5s3.5-1.57 3.5-3.5h2c0 1.93 1.57 3.5 3.5 3.5S22 21.93 22 20s-1.57-3.5-3.5-3.5h-11l.1-.18L8.1 14h8.9c.78 0 1.45-.45 1.78-1.11l3.07-6.16c.11-.21.17-.44.17-.68 0-.83-.67-1.5-1.5-1.5H7.42l-.6-1.2A1 1 0 0 0 6 4Zm3 15.5c0 .83-.67 1.5-1.5 1.5S7 20.33 7 19.5 7.67 18 8.5 18 10 18.67 10 19.5Zm9 0c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5Z"
              />
            </svg>
            <span v-if="totalQuantity > 0" class="cart-badge">
              {{ totalQuantity }}
            </span>
          </button>
          <transition name="fade">
            <div v-if="ui.previewOpen" class="cart-preview">
              <p v-if="totalQuantity === 0" class="empty-text">
                購物車目前是空的
              </p>
              <template v-else>
                <ul class="preview-list">
                  <li
                    v-for="item in previewItems"
                    :key="item.id"
                    class="preview-entry"
                  >
                    <div class="preview-thumb"></div>
                    <div class="preview-info">
                      <p class="preview-name">{{ item.name }}</p>
                      <p class="preview-meta">
                        x{{ item.quantity }}・NT$
                        {{ item.price.toLocaleString() }}
                      </p>
                    </div>
                  </li>
                </ul>
                <div class="preview-summary">
                  <span>小計</span>
                  <span>NT$ {{ subtotal.toLocaleString() }}</span>
                </div>
                <button class="checkout-btn" @click="goToCheckout">
                  前往結帳
                </button>
              </template>
            </div>
          </transition>
        </li>
        <template v-if="!currentUser">
          <li>
            <router-link to="/login" class="nav-link">sign in</router-link>
          </li>
          <li>
            <router-link to="/register" class="nav-link">sign up</router-link>
          </li>
        </template>
        <template v-else>
          <li class="nav-link">{{ currentUser.name }} 您好！</li>
          <li>
            <a href="#" class="nav-link" @click.prevent="onLogout">登出</a>
          </li>
        </template>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { useCartStore } from "../stores/cartStore";
import { getCurrentUser, logoutUser } from "../utils/auth";

const router = useRouter();
const currentUser = ref(null);
const cart = useCartStore();
const ui = reactive({
  previewOpen: false,
});

function refreshUser() {
  currentUser.value = getCurrentUser();
}

function onLogout() {
  logoutUser();
  refreshUser();
  router.push("/");
}

function handleStorage() {
  refreshUser();
}

const totalQuantity = computed(() => cart.totalQuantity);
const previewItems = computed(() => cart.items.slice(0, 3));
const subtotal = computed(() => cart.subtotal);

function goToCart() {
  if (router.hasRoute("Cart")) {
    router.push({ name: "Cart" });
  } else if (router.hasRoute("Checkout")) {
    router.push({ name: "Checkout" });
  } else {
    router.push("/all-items");
  }
}

function goToCheckout() {
  if (router.hasRoute("Checkout")) {
    router.push({ name: "Checkout" });
  } else if (router.hasRoute("Cart")) {
    router.push({ name: "Cart" });
  } else {
    router.push("/all-items");
  }
}

onMounted(() => {
  refreshUser();
  window.addEventListener("storage", handleStorage);
});

onBeforeUnmount(() => {
  window.removeEventListener("storage", handleStorage);
});
</script>

<style scoped>
.cart-wrapper {
  position: relative;
  list-style: none;
}
.cart-button {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
}
.cart-icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
  color: #111;
}
.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #d7263d;
  color: #fff;
  font-size: 12px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}
.cart-preview {
  position: absolute;
  top: 110%;
  right: 0;
  width: 260px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 12px 32px rgba(15, 17, 26, 0.1);
  z-index: 100;
}
.empty-text {
  font-size: 13px;
  color: #666;
  margin: 0;
}
.preview-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.preview-entry {
  display: flex;
  gap: 10px;
}
.preview-thumb {
  width: 48px;
  height: 48px;
  background: #f5f5f5;
  border-radius: 6px;
}
.preview-info {
  flex: 1;
}
.preview-name {
  margin: 0;
  font-size: 14px;
  color: #111;
}
.preview-meta {
  margin: 4px 0 0;
  font-size: 12px;
  color: #666;
}
.preview-summary {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #111;
  border-top: 1px solid #eee;
  padding-top: 10px;
  margin-bottom: 12px;
}
.checkout-btn {
  width: 100%;
  border: none;
  background: #111;
  color: #fff;
  padding: 10px 0;
  border-radius: 6px;
  cursor: pointer;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (max-width: 768px) {
  .cart-preview {
    right: -180px;
    /* width: 100%; */
  }
}
@media (max-width: 480px) {
  .cart-preview {
    display: none;
  }
}
</style>
