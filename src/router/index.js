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
    meta: { requiresAuth: true },
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
  if (to.matched.some(record => record.meta.requiresAuth)) {
    const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/check-session`)
      .catch((error) => {
        console.error("Failed to check session:", error);
        return null;
      });

    if (response && response.data === "0") {
      next({ path: '/login', query: { redirect: to.fullPath } });
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
