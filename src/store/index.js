// src/store/index.js

import { createStore } from "vuex";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
const SOCKET_URL = `${import.meta.env.VITE_HOST_URL}/ws-message`;

export const store = createStore({
  state: {
    stompClient: null,
  },
  mutations: {
    setStompClient(state, client) {
      state.stompClient = client;
    },
  },
  actions: {
    connectStomp({ commit }) {
      const socket = new SockJS(SOCKET_URL);
      const client = Stomp.over(socket);
      client.connect({}, (frame) => {
        commit("setStompClient", client);
      });
    },
    disconnectStomp({ state }) {
      if (state.stompClient && state.stompClient.connected) {
        state.stompClient.disconnect();
      }
    },
  },
});
