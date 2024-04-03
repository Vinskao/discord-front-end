<!-- src/views/Register.vue -->

<template>
    <Layout />

    <div class="register-container">
        <h1>註冊</h1>
        <form @submit.prevent="register">
            <div class="form-group">
                <label for="username">Username</label>
                <input v-model="username" type="text" id="username" required>
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input v-model="password" type="password" id="password" required>
            </div>
            <!-- 生日输入框 -->
            <div class="form-group">
                <label for="birthday">Birthday</label>
                <input v-model="birthday" type="datetime-local" id="birthday" required>
            </div>

            <!-- 兴趣输入框 -->
            <div class="form-group">
                <label for="interests">Interests</label>
                <input v-model="interests" type="text" id="interests" required>
            </div>
            <button type="submit">註冊</button>
        </form>
    </div>
</template>

<script setup>
import axios from 'axios';
import Swal from 'sweetalert2';
import Layout from "../layouts/Layout.vue";
import { ref } from 'vue';
import { useRouter } from "vue-router";
axios.defaults.withCredentials = true;



const username = ref('');
const password = ref('');
const birthday = ref('');
const interests = ref('');
const router = useRouter();
const register = async () => {
    const currentDateTime = new Date();
    const selectedBirthday = new Date(birthday.value);
    // 检查生日是否超过当前日期
    if (selectedBirthday > currentDateTime) {
        await Swal.fire('错误', '生日不能超过当前日期', 'error');
        return;
    }
    try {
        const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/register`, {
            username: username.value,
            password: password.value,
            birthday: birthday.value,
            interests: interests.value
        });

        if (response.status === 200) {
            await Swal.fire('成功', '用戶成功註冊', 'success');
            router.push('/login');
        }
    } catch (error) {
        const message = error.response?.data || '註冊失敗';
        await Swal.fire('用戶名已存在', message, 'error');
    }
};
</script>

<style>
.register-container {
    max-width: 300px;
    margin: auto;
    padding: 20px;
}

.form-group {
    margin-bottom: 10px;
}

.form-group label {
    display: block;
}

.form-group input {
    width: 100%;
    padding: 8px;
    margin-top: 4px;
}

button {
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    cursor: pointer;
}

button:hover {
    background-color: #0056b3;
}
</style>
