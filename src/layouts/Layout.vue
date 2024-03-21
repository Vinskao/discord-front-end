<script setup>
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const store = useStore();

const isLoggedIn = store.state.auth.isLoggedIn; 
const logout = () => {
    store.dispatch('auth/logout').then(() => {
        router.push('/login');
    });
};
</script>

<template>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
        <div class="container-fluid">
            <a class="navbar-brand" href="#">資產管理系統</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav">
                    <li class="nav-item">
                        <router-link class="nav-link" to="/index">Home</router-link>
                    </li>
                    <li class="nav-item">
                        <router-link class="nav-link" to="/login">Login</router-link>
                    </li>
                    <li v-if="isLoggedIn" class="nav-item" style="margin: auto;">
                        <button class="nav-link" @click="logout">Logout</button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>
</template>
