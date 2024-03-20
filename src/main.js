import { createApp } from "vue";
import ElementPlus from "element-plus";
import "./style.css";
import App from "./App.vue";

import router from "./router/index.js";
import store from "./store/index.js";
import "bootstrap";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootswatch/dist/darkly/bootstrap.min.css";
import "element-plus/theme-chalk/dark/css-vars.css";

const app = createApp(App);

window.$vueApp = app;

app.use(ElementPlus, { locale: "zh-TW" }).use(router).use(store).mount("#app");
