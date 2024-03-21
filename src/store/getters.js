// store/getters.js

const getters = {
    isLoggedIn(state) {
        return state.auth.isLoggedIn;
    },
};
export default getters;
  