<template>
  <div class="home">
    <Navbar />
    <HeroBanner title="Creative" />
    <div class="auth-container">
      <h1>登入</h1>
      <form @submit.prevent="onSubmit" class="auth-form">
        <label>
          Email
          <input
            v-model="email"
            type="email"
            required
            placeholder="you@example.com"
          />
        </label>
        <label>
          Password
          <input
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
          />
        </label>
        <button type="submit">登入</button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <p class="hint">
          還沒有帳號嗎？
          <router-link to="/register">註冊</router-link>
        </p>
      </form>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { loginUser } from "../utils/auth";
import Navbar from "../components/Navbar.vue";
import HeroBanner from "../components/HeroBanner.vue";
import Footer from "../components/Footer.vue";
const router = useRouter();
const email = ref("");
const password = ref("");
const errorMessage = ref("");

function onSubmit() {
  errorMessage.value = "";
  try {
    loginUser({ email: email.value.trim(), password: password.value });
    router.push("/");
  } catch (e) {
    errorMessage.value = e?.message || "Login failed";
  }
}
</script>

<style scoped>
.auth-container {
  /* max-width: 420px; */
  width: 50%;
  margin: 40px auto;
  padding: 24px;
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
label {
  display: flex;
  flex-direction: column;
  font-size: 14px;
  gap: 6px;
}
input {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
button {
  padding: 10px 14px;
  border: none;
  background: #111;
  color: #fff;
  border-radius: 6px;
  cursor: pointer;
}
.error {
  color: #c00;
  font-size: 13px;
}
.hint {
  font-size: 13px;
}
</style>
