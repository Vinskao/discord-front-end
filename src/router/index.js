// router/index.js

import { createRouter, createWebHashHistory } from "vue-router";
import index from "../views/Index.vue";
import login from "../views/Login.vue";
import register from "../views/Register.vue";
import security from "../views/Security.vue";

import axios from "axios";
const routes = [
  {
    path: "/",
    redirect: "/index",
    meta: { requiresAuth: true },
  },
  {
    path: "/register",
    component: register,
  },
  {
    path: "/index",
    component: index,
    meta: { requiresAuth: true },
  },
  {
    path: "/security",
    component: security,
    meta: { requiresAuth: true },
    name: "security",
  },
  {
    path: "/login",
    component: login,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_HOST_URL}/user/me`
      );
      if (response && response.status === 200) {
        // 用户已登录
        next();
      } else {
        throw new Error("Unauthorized");
      }
    } catch (error) {
      console.error("用户未登录或会话已过期:", error);
      // 未通过认证，重定向到登录页面，并附带原本想要访问的页面路径，方便登录后跳转。
      next({ path: "/login", query: { redirect: to.fullPath } });
    }
  } else {
    // 对于不需要身份验证的路由，直接放行
    next();
  }
});

export default router;
