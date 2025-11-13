<template>
  <router-view />
</template>

<script setup>
import { onMounted, onBeforeUnmount } from "vue";
import { useCartStore } from "./stores/cartStore";
import { clearGuestCart } from "./api/cartApi";

const cart = useCartStore();

// 監聽登入事件：同步購物車
function handleLogin(event) {
  // 未來接 API 時，這裡可以：
  // 1. 從伺服器取得使用者的購物車
  // 2. 合併本地與伺服器購物車
  // 3. 更新 store
  
  // 目前實作：切換到登入購物車（從 guest 切換到 user）
  cart.loadCart().catch((err) => {
    console.error("登入後載入購物車失敗", err);
  });
  
  // 未來 API 實作範例：
  // async function syncOnLogin() {
  //   try {
  //     const serverCart = await fetchUserCart(); // 從 API 取得
  //     await cart.syncWithServer(serverCart);
  //   } catch (err) {
  //     console.error("同步購物車失敗", err);
  //   }
  // }
}

// 監聽登出事件：處理購物車
function handleLogout() {
  // 策略選擇：
  // 選項 1：保留本地購物車（切換到訪客模式）
  // 選項 2：清空購物車
  // 選項 3：保留到訪客購物車，清空登入購物車
  
  // 目前實作：保留本地購物車，切換到訪客模式
  cart.loadCart().catch((err) => {
    console.error("登出後載入購物車失敗", err);
  });
  
  // 可選：清空訪客購物車（如果希望登出時清空）
  // clearGuestCart();
  
  // 未來 API 實作範例：
  // async function handleLogoutWithAPI() {
  //   try {
  //     // 將當前購物車保存到訪客購物車
  //     await saveGuestCart(cart.items);
  //     // 清空登入購物車
  //     cart.clearCart();
  //   } catch (err) {
  //     console.error("處理登出購物車失敗", err);
  //   }
  // }
}

onMounted(() => {
  window.addEventListener("cart:sync-on-login", handleLogin);
  window.addEventListener("cart:sync-on-logout", handleLogout);
});

onBeforeUnmount(() => {
  window.removeEventListener("cart:sync-on-login", handleLogin);
  window.removeEventListener("cart:sync-on-logout", handleLogout);
});
</script>
