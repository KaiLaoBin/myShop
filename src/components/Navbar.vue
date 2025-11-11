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
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useRouter } from "vue-router";
import { getCurrentUser, logoutUser } from "../utils/auth";

const router = useRouter();
const currentUser = ref(null);

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

onMounted(() => {
  refreshUser();
  window.addEventListener("storage", handleStorage);
});

onBeforeUnmount(() => {
  window.removeEventListener("storage", handleStorage);
});
</script>
