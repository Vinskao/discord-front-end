const getters = {
    loggedIn(state) {
        return state.user !== null;
    },
};
export default getters;
  