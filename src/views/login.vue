<!-- src/views/login.vue -->
<template>
  <Layout />

  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div class="mb-3">
        <label for="id" class="form-label">User Id</label>
        <input type="text" class="form-control" id="id" v-model="id" required />
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
import { useStore } from "vuex";

const store = useStore();
const id = ref("");
const password = ref("");
const errorMessage = ref("");
const router = useRouter();

const login = async () => {
  try {
    const userData = {
      id: id.value,
      password: password.value,
    };
    // 登入驗證
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/users/login`,
      userData
    );
    if (response.status === 200) {
      console.log("Login successful");
      localStorage.setItem("userId", id.value);
      // 取得使用者資料
      const userId = {
        id: id.value,
      };
      const userResponse = await axios.post(
        `${import.meta.env.VITE_HOST_URL}/users/find-by-id`,
        userId
      );
      const user = userResponse.data[0];
      if (user) {
        // 將使用者名稱儲存在localStorage中
        localStorage.setItem("username", user.name);
      }
      await store.dispatch("auth/login");
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
