// store/modules/auth.js
export default {
    namespaced: true,
    state: {
        isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    },
    mutations: {
        setLoggedIn(state, isLoggedIn) {
        state.isLoggedIn = isLoggedIn;
        localStorage.setItem('isLoggedIn', isLoggedIn); 
        },
    },
    actions: {
        login({ commit }) {
        commit('setLoggedIn', true);
        },
        logout({ commit }) {
        commit('setLoggedIn', false);
        },
    },
};
