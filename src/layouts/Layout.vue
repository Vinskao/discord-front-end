<!-- src/layouts/Layouts.vue -->

<script setup>
import { useRouter } from "vue-router";
import axios from "axios";
import Swal from "sweetalert2";
import { ref } from "vue";
import { useStore } from "vuex";

axios.defaults.withCredentials = true;

const router = useRouter();
const store = useStore();

const logout = async () => {
  store.dispatch("disconnectStomp");
  try {
    await axios.post(`${import.meta.env.VITE_HOST_URL}/user/logout`);
    localStorage.removeItem("userInfo");
    await Swal.fire({
      icon: "success",
      title: "您已登出",
      showConfirmButton: false,
      timer: 700,
    });
    sessionStorage.removeItem("bypassAuth");
    router.push("/login");
  } catch (error) {
    console.error("Error during logout:", error);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "請重試",
    });
  }
};
</script>
<style scoped>
.transparent-navbar {
  background-color: rgba(0, 0, 0, 0);
}

.horizontal-navbar {
  display: flex;
  flex-direction: row;
  /* Ensures items are arranged in a row */
  align-items: center;
  /* Vertically centers the nav items */
}

.nav-item.nav-link {
  margin-right: 20px;
  /* Adds some space between nav items */
}

.logout-button {
  background-color: transparent;
  border: none;
  color: grey;
  transition: color 0.2s ease-in-out, font-weight 0.2s ease-in-out;
}

.logout-button:hover {
  color: red;
  font-weight: bold;
}
</style>

<template>
  <nav class="navbar navbar-dark fixed-top transparent-navbar">
    <div class="container-fluid">
      <div class="navbar-nav horizontal-navbar">
        <router-link class="nav-item nav-link" to="/index">聊天</router-link>
        <router-link class="nav-item nav-link" to="/register">註冊</router-link>
        <router-link class="nav-item nav-link" to="/login">登入</router-link>
        <router-link class="nav-item nav-link" to="/security">安全</router-link>
        <button class="nav-item nav-link logout-button" @click="logout">
          登出
        </button>
      </div>
    </div>
  </nav>
</template>
