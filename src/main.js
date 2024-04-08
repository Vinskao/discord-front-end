// src/main.js

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
import { store } from "./store";

if (typeof window !== "undefined") {
  window.global = window;
}
const app = createApp(App);

window.$vueApp = app;

app.use(ElementPlus, { locale: "zh-TW" }).use(router).use(store).mount("#app");

axios.interceptors.response.use(
  (response) => {
    // 正常响应直接返回
    return response;
  },
  (error) => {
    // 如果错误来自 /export-chat-history，保持原有处理
    if (error.config && error.config.url.includes("/export-chat-history")) {
      return Promise.reject(error);
    }

    // 针对 401 和 403 错误，如果当前不在登录页面，则重定向到登录页面
    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403)
    ) {
      // 检查当前页面是否已经是登录页，避免重定向循环
      if (window.location.pathname !== "/login") {
        // 附带当前页面路径，便于登录后跳转回来
        window.location.href =
          "/login?redirect=" +
          encodeURIComponent(window.location.pathname + window.location.search);
      }
    }

    return Promise.reject(error);
  }
);
