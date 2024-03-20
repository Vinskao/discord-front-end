import {createRouter, createWebHashHistory} from 'vue-router'
import index from '../views/index.vue'
import login from '../views/login.vue'

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
  const isLoggedIn = false; 

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