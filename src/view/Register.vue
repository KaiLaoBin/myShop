<template>
  <div class="home">
    <Navbar />
    <HeroBanner title="Creative" />
    <div class="auth-container">
      <h1>帳號註冊</h1>
      <form @submit.prevent="onSubmit" class="auth-form">
        <label>
          名稱
          <input v-model="name" type="text" required placeholder="Your name" />
        </label>
        <label>
          Email
          <input
            v-model="email"
            type="email"
            required
            placeholder="brand@example.com"
          />
        </label>
        <label>
          密碼
          <input
            v-model="password"
            type="password"
            required
            placeholder="Create a password"
          />
        </label>
        <label>
          再次輸入密碼
          <input
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Confirm password"
          />
        </label>
        <button type="submit">註冊帳號</button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        <p class="hint">
          已經有帳號了嗎？
          <router-link to="/login">登入</router-link>
        </p>
      </form>
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { registerUser } from "../utils/auth";
import Navbar from "../components/Navbar.vue";
import HeroBanner from "../components/HeroBanner.vue";
import Footer from "../components/Footer.vue";

const router = useRouter();
const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");

function onSubmit() {
  errorMessage.value = "";
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "密碼不一致！請重新輸入";
    return;
  }
  try {
    registerUser({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
    router.push("/");
  } catch (e) {
    errorMessage.value = e?.message || "註冊失敗";
  }
}
</script>

<style scoped>
.auth-container {
  /* max-width: 480px; */
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
