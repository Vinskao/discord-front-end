<!-- src/views/login.vue -->
<template>
  <Layout />

  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input type="text" class="form-control" id="username" v-model="username" required />
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" id="password" v-model="password" required />
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
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const store = useStore();
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const router = useRouter();

const login = async () => {
  try {
    const userData = {
      name: username.value,
      password: password.value
    };
    const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/Users/login`, userData);
    console.log(response.data);
    if (response.status === 200) {
      console.log("Login successful");
      localStorage.setItem('user', username.value);
      await store.dispatch('auth/login');
      router.push('/index');
    } else {
      errorMessage.value = "Invalid username or password";
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
