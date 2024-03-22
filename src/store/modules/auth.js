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
        clearLocalStorage(state) {
            for (const key in localStorage) {
                if (key !== 'isLoggedIn') {
                    localStorage.removeItem(key);
                }
            }
        },
    },
    actions: {
        login({ commit }) {
            commit('setLoggedIn', true);
        },
        logout({ commit }) {
            commit('setLoggedIn', false);
            commit('clearLocalStorage');
        },
    },
};
