import { createApp } from "vue";
import ElementPlus from "element-plus";
import "./style.css";
import App from "./App.vue";
import axios from "axios";
import router from "./router/index.js";
import "bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootswatch/dist/darkly/bootstrap.min.css";
import "element-plus/theme-chalk/dark/css-vars.css";

const app = createApp(App);

window.$vueApp = app;

app.use(ElementPlus, { locale: "zh-TW" }).use(router).mount("#app");

axios.interceptors.response.use(
    response => {
        return response;
    },
    error => {
        // 检查错误是否来自exportChatHistory
        if (error.config && error.config.url.includes('/export-chat-history')) {
            // 对exportChatHistory的错误处理保持原样
            return Promise.reject(error);
        }

        if (error.response.status === 401 || error.response.status === 403) {
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);
