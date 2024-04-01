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



const username = ref('');
const password = ref('');
const router = useRouter();
const register = async () => {
    try {
        const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/register`, {
            username: username.value,
            password: password.value,
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
