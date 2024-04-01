<!-- src/views/login.vue -->
<template>
  <Layout />

  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input
          type="text"
          class="form-control"
          id="id"
          v-model="username"
          required
        />
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input
          type="password"
          class="form-control"
          id="password"
          v-model="password"
          required
        />
      </div>
      <button type="submit" class="btn btn-primary">Login</button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Layout from "../layouts/Layout.vue";
import axios from "axios";
import { useRouter } from "vue-router";
axios.defaults.withCredentials = true;
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const router = useRouter();

const login = async () => {
  try {
    const userData = {
      username: username.value,
      password: password.value,
    };
    // 登入驗證
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/user/login`,
      userData
    );
    if (response.status === 200) {
      console.log("Login successful");
      const user = response.data;
      console.log("User object:", user);
      const { password, ...userInfo } = response.data; // 解構賦值並排除密碼
      localStorage.setItem("userInfo", JSON.stringify(userInfo)); // 儲存用戶資訊到 localStorage
      router.push("/index");
    } else {
      errorMessage.value = "Invalid id or password";
    }
  } catch (error) {
    console.error("Error:", error);
    errorMessage.value = "An error occurred while processing your request";
  }
};
</script>

<style scoped>
@import url("../style.css");

.login-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
}

.error-message {
  color: red;
  margin-top: 10px;
}
</style>
