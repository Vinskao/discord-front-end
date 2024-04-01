<template>
    <Layout />

    <div class="security-question">
        <h1>安全問題</h1>

        <div class="form-section">
            <h3>新增安全問題</h3>
            <form @submit.prevent="addQuestion">
                <select v-model="selectedQuestionAdd">
                    <option disabled value="">請選擇一個問題</option>
                    <option>你的媽媽叫什麼名子?</option>
                    <option>你的狗狗叫什麼名子?</option>
                    <option>你的國小叫什麼名子?</option>
                </select>
                <input type="text" v-model="answerAdd" placeholder="您的答案" />
                <button type="submit">新增問題</button>
            </form>
        </div>

        <div class="form-section">


            <h3>修改安全問題</h3>
            <form @submit.prevent="modifyQuestion">
                <select v-model="selectedQuestionModify">
                    <option disabled value="">請選擇一個新問題</option>
                    <option>你的媽媽叫什麼名子?</option>
                    <option>你的狗狗叫什麼名子?</option>
                    <option>你的國小叫什麼名子?</option>
                </select>
                <input type="text" v-model="answerModify" placeholder="您的新答案" />
                <button type="submit">提交修改</button>
            </form>
        </div>

        <div class="form-section">
            <h1>個人資料</h1>

            <h3>修改密碼</h3>
            <form @submit.prevent="changePassword">
                <input type="password" v-model="newPassword" placeholder="新密碼"
                    pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+]{8,}$" title="密碼必須包含英文字母和數字，並至少8個字符長度。"
                    required />
                <button type="submit">更改密碼</button>
            </form>
        </div>

    </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import Layout from "../layouts/Layout.vue";

const selectedQuestionAdd = ref('');
const answerAdd = ref('');
const selectedQuestionModify = ref('');
const answerModify = ref('');
const newPassword = ref('');

const userInfo = JSON.parse(localStorage.getItem('userInfo'));

const addQuestion = async () => {
    if (!userInfo) {
        await Swal.fire('錯誤', '未找到用戶信息。請登錄。', 'error');
        return;
    }

    const postData = {
        username: userInfo.username,
        question: selectedQuestionAdd.value,
        answer: answerAdd.value
    };

    try {
        await axios.post(`${import.meta.env.VITE_HOST_URL}/add-security-question`, postData);
        await Swal.fire('成功', '安全問題已成功添加', 'success');
    } catch (error) {
        console.error('新增安全問題時出錯:', error);
        await Swal.fire('錯誤', '新增安全問題失敗，請稍後再試。', 'error');
    }
};

const modifyQuestion = async () => {
    if (!userInfo) {
        await Swal.fire('錯誤', '未找到用戶信息。請登錄。', 'error');
        return;
    }

    const postData = {
        username: userInfo.username,
        question: selectedQuestionModify.value,
        answer: answerModify.value
    };

    try {
        await axios.post(`${import.meta.env.VITE_HOST_URL}/modify-security-question`, postData);
        await Swal.fire('成功', '安全問題已成功修改', 'success');
    } catch (error) {
        console.error('修改安全問題時出錯:', error);
        await Swal.fire('錯誤', '修改安全問題失敗，請稍後再試。', 'error');
    }
};

const changePassword = async () => {
    if (!userInfo) {
        await Swal.fire('錯誤', '未找到用戶信息。請登錄。', 'error');
        return;
    }

    const postData = {
        username: userInfo.username,
        password: newPassword.value
    };

    try {
        await axios.post(`${import.meta.env.VITE_HOST_URL}/user/update-password`, postData);
        await Swal.fire('成功', '密碼已成功更改', 'success');
    } catch (error) {
        console.error('更改密碼時出錯:', error);
        await Swal.fire('錯誤', '更改密碼失敗，請稍後再試。', 'error');
    }
};
</script>

<style scoped>
.security-question {
    max-width: 500px;
    margin: 20px auto;
}

.form-section {
    margin-bottom: 40px;
}

.form-section h3 {
    margin-bottom: 15px;
}

form {
    display: flex;
    flex-direction: column;
}

select,
input {
    padding: 10px;
    margin-bottom: 20px;
    border: 1px solid #ccc;
    border-radius: 4px;
}

button {
    padding: 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 4px;
}

button:hover {
    background-color: #45a049;
}
</style>