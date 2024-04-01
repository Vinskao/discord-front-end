// router/index.js

import { createRouter, createWebHashHistory } from "vue-router";
import index from "../views/index.vue";
import login from "../views/login.vue";
import axios from "axios";

const routes = [
  {
    path: "/",
    redirect: "/index",
  },
  {
    path: "/index",
    component: index,
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

export default router;
