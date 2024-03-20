<template>
  <Layout />

  <div class="login-container">
    <h2>Login</h2>
    <form @submit.prevent="login">
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input type="text" class="form-control" id="username" v-model="username" required>
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" id="password" v-model="password" required>
      </div>
      <button type="submit" class="btn btn-primary">Login</button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Layout from '../layouts/Layout.vue';

const username = ref('');
const password = ref('');
const errorMessage = ref('');

const login = () => {
  // 在此处编写登录逻辑，例如向服务器发送登录请求
  if (username.value === 'admin' && password.value === 'password') {
    // 登录成功，可以跳转到其他页面
    console.log('Login successful');
  } else {
    // 登录失败，显示错误消息
    errorMessage.value = 'Invalid username or password';
  }
};
</script>

<style scoped>
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
