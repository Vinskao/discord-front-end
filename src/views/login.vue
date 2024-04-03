<!-- src/views/login.vue -->
<template>
  <Layout />

  <div class="login-container">
    <h2>登入</h2>
    <form @submit.prevent="login">
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input type="text" class="form-control" id="id" v-model="username" required />
      </div>
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" id="password" v-model="password" required />
      </div>
      <button type="submit" class="btn btn-primary">登入</button>
    </form>
    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
  </div>

  <button @click="toggleForgotPassword">忘記密碼？</button>

  <div v-if="showForgotPassword">
    <input v-if="!showSecurityQuestion" type="text" v-model="forgotUsername" placeholder="請輸入您的用戶名" />
    <button v-if="!showSecurityQuestion" @click="fetchSecurityQuestion">提交</button>

    <div v-if="showSecurityQuestion">
      <p>{{ securityQuestion }}</p>
      <input type="text" v-model="securityAnswer" placeholder="請輸入答案" />
      <button @click="verifySecurityAnswer">驗證答案</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import Layout from "../layouts/Layout.vue";
import axios from "axios";
import { useRouter } from "vue-router";
import Swal from 'sweetalert2';

axios.defaults.withCredentials = true;
const username = ref("");
const password = ref("");
const errorMessage = ref("");
const router = useRouter();

// 忘記密碼
const forgotUsername = ref('');
const securityQuestion = ref('');
const securityAnswer = ref('');
const showForgotPassword = ref(false);
const showSecurityQuestion = ref(false);

const toggleForgotPassword = () => {
  showForgotPassword.value = !showForgotPassword.value;
};

const fetchSecurityQuestion = async () => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/get-question`, { username: forgotUsername.value });
    securityQuestion.value = response.data;
    showSecurityQuestion.value = true;
  } catch (error) {
    console.error('Error fetching security question:', error);
    await Swal.fire('錯誤', '無法獲取安全問題，請重試。', 'error');
  }
};

const verifySecurityAnswer = async () => {
  try {
    const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/verify-answer`, {
      username: forgotUsername.value,
      question: securityQuestion.value,
      answer: securityAnswer.value
    });
    if (response.data) {
      // Using state to pass the resetPassword flag
      router.push({ name: 'security', state: { resetPassword: true, username: forgotUsername.value } });
    } else {
      await Swal.fire('錯誤', '答案不正確。', 'error');
    }
  } catch (error) {
    console.error('Error verifying security answer:', error);
    await Swal.fire('錯誤', '驗證答案時出現錯誤，請重試。', 'error');
  }
};

const login = async () => {
  try {
    const userData = new URLSearchParams();
    userData.append('username', username.value);
    userData.append('password', password.value);

    const loginResponse = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/login`, userData);

    if (loginResponse.status === 200) {
      // 登录成功后，调用API获取用户信息
      const userInfoResponse = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/me`);
      localStorage.setItem("userInfo", JSON.stringify(userInfoResponse.data)); // 保存用户信息到localStorage
      router.push("/index"); // 重定向到首页
    } else {
      errorMessage.value = "Invalid username or password";
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // 如果返回401未授权，清除可能存在的用户信息并重定向到登录页面
      localStorage.removeItem("userInfo");
      router.push("/login");
      errorMessage.value = "Invalid username or password";
    } else {
      errorMessage.value = error.response ? error.response.data : "An error occurred while processing your request";
    }
  }
};
// const login = async () => {
//   try {
//     const userData = {
//       username: username.value,
//       password: password.value,
//     };
//     // 登入驗證
//     const response = await axios.post(
//       `${import.meta.env.VITE_HOST_URL}/user/login`,
//       userData
//     );
//     if (response.status === 200) {
//       console.log("Login successful");
//       const user = response.data;
//       console.log("User object:", user);
//       const { password, ...userInfo } = response.data; // 解構賦值並排除密碼
//       localStorage.setItem("userInfo", JSON.stringify(userInfo)); // 儲存用戶資訊到 localStorage
//       router.push("/index");
//     } else {
//       errorMessage.value = "Invalid id or password";
//     }
//   } catch (error) {
//     console.error("Error:", error);
//     errorMessage.value = "An error occurred while processing your request";
//   }
// };
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
