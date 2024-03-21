// router/index.js


import {createRouter, createWebHashHistory} from 'vue-router'
import index from '../views/index.vue'
import login from '../views/login.vue'
import { useStore } from 'vuex';

const routes = [
  {
    path: '/',
    redirect: '/index'
  },
  {
    path: '/index',
    component: index
  },
  {
    path: '/login',
    component: login
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const store = useStore();
  const isLoggedIn = store.getters['isLoggedIn'];
  console.log(isLoggedIn);
  if (to.path === '/login') {
      if (isLoggedIn) {
          next('/index');
      } else {
          next(); 
      }
  } else {
      if (!isLoggedIn) {
          next('/login');
      } else {
          next(); 
      }
  }
});

export default router;