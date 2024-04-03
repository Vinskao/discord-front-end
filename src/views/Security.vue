<!-- src/views/Security.vue -->

<template>
    <Layout />

    <div class="security-question">
        <h1 @click="toggleSection('securityQuestion')">安全問題</h1>
        <div v-if="sections.securityQuestion" class="content">
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
            <br />
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
        </div>


    </div>


    <div class="modify-info">
        <h1 @click="toggleSection('modifyInfo')">機密資料</h1>
        <div v-if="sections.modifyInfo" class="content">

            <div class="form-section">

                <h3>修改密碼</h3>
                <form @submit.prevent="changePassword">
                    <input type="password" v-model="newPassword" placeholder="新密碼"
                        pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+]{8,}$" title="密碼必須包含英文字母和數字，並至少8個字符長度。"
                        required />
                    <button type="submit">更改密碼</button>
                </form>
            </div>
        </div>
    </div>


</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import Layout from "../layouts/Layout.vue";
import { useRoute } from 'vue-router';
import router from "../router/index.js";

axios.defaults.withCredentials = true;

const selectedQuestionAdd = ref('');
const answerAdd = ref('');
const selectedQuestionModify = ref('');
const answerModify = ref('');
const newPassword = ref('');
const route = useRoute();
const resetPassword = ref(false);

const userInfo = JSON.parse(localStorage.getItem('userInfo'));

const sections = reactive({
    securityQuestion: false,
    modifyInfo: false
});

onMounted(async () => {
    // 检查会话状态
    try {
        const userInfoResponse = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/me`);
        // 如果请求成功，说明用户已登录，可以继续加载群组房间信息
        console.log("User info:", userInfoResponse.data);

        // 这里可以添加额外的逻辑，例如如果 userInfoResponse.data 为空，则判定为未登录
        if (!userInfoResponse.data || Object.keys(userInfoResponse.data).length === 0) {
            throw new Error('No user info returned'); // 抛出错误以便在 catch 块中处理
        }
    } catch (error) {
        console.error("用户未登录或会话已过期:", error);
        router.push('/login');
    }

    if (route.fullPath && history.state && history.state.resetPassword) {
        // The resetPassword state is present, allowing the toggleSection function to be called.
        toggleSection('modifyInfo');
    } else {
        // The resetPassword state is not present, ensure the modifyInfo section remains closed.
        sections.modifyInfo = false; // Ensure the section is not opened by default
    }
});

const toggleSection = (section) => {
    // Only toggle the 'modifyInfo' section if the resetPassword state is true
    if (section === 'modifyInfo' && !(route.fullPath && history.state && history.state.resetPassword)) {
        // Unauthorized attempt to open the modifyInfo section
        Swal.fire({
            icon: 'error',
            title: '無法訪問',
            text: '請前往登入頁面使用忘記密碼以進入進行密碼修改',
        });
        return; // Prevent the section from toggling
    }
    sections[section] = !sections[section];
};

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
    // Retrieve username from the state if available, otherwise fallback to the loggedIn user's username
    const usernameForPasswordChange = history.state && history.state.username ? history.state.username : userInfo.username;


    const postData = {
        username: usernameForPasswordChange,
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
.security-question h1,
.modify-info h1 {
    cursor: pointer;
    transition: color 0.3s ease;
    /* Smooth transition for color change */
}

.security-question h1:hover,
.modify-info h1:hover {
    color: #007bff;
    /* Change color on hover */
}

.content {
    /* Styles for the collapsible content */
    padding: 15px;
    border: 1px solid #ccc;
    border-radius: 4px;
    margin-top: 10px;
}

.security-question,
.modify-info {
    max-width: 500px;
    margin: 20px auto;
    cursor: pointer;
    /* Makes the entire section clickable */
}

.form-sections {
    margin-bottom: 40px;
    display: none;
    /* Initially hide the form sections */
}

.form-sections h3 {
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
