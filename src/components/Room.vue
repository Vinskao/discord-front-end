<!-- /src/components/Room.vue -->

<template>
  <div class="room-container">
    <div v-if="!props.roomId" class="no-room-selected">
      請選擇一個聊天室以加入聊天。
    </div>
    <div v-else class="room-content">
      <div class="room">
        <div class="messages" ref="messagesContainer">
          <div v-for="(msg, index) in messages" :key="index" :class="{
      'my-message': isMyMessage(msg.username),
      'other-message': !isMyMessage(msg.username),
      'system-message': msg.type === 'JOIN' || msg.type === 'LEAVE',
    }" class="message">
            <div v-if="msg.type === 'JOIN' || msg.type === 'LEAVE'">
              <em>{{ msg.message }}</em>
              <span class="message-time">{{ formatTime(msg.time) }}</span>
            </div>
            <div v-else>
              <strong>{{ msg.username.split("@")[0] }}：</strong>
              {{ msg.message }}
              <span class="message-time">{{ formatTime(msg.time) }}</span>
            </div>
          </div>
        </div>

        <div class="input-area">
          <input type="text" v-model="inputMessage" placeholder="請輸入訊息..." />
          <button @click="sendMessage">傳</button>
          <button @click="leaveRoom(props.roomId)" class="leave-btn">離</button>
        </div>
      </div>

      <div class="user-sidebar">
        <div v-for="user in roomUsers" :key="user.username" class="user-entry">
          {{ user.username.split("@")[0] }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, watchEffect, onMounted, onBeforeUnmount } from "vue";
import SockJS from "sockjs-client/dist/sockjs.min.js";
import { Stomp } from "@stomp/stompjs";
import axios from "axios";

axios.defaults.withCredentials = true;

const messagesContainer = ref(null);
const userInfo = ref(null);
const currentUserUsername = ref("");
const userInfoStr = localStorage.getItem("userInfo");
if (userInfoStr) {
  const userInfo = JSON.parse(userInfoStr);
  currentUserUsername.value = userInfo.username.split("@")[0];
}
// Props
const props = defineProps({
  roomId: Number,
});
const emit = defineEmits(["roomLeft"]);

// 儲存訊息的陣列
const messages = ref([]);
// 使用者輸入的訊息
const inputMessage = ref("");
// 使用者名稱
// STOMP 客戶端
let stompClient = null;

const roomUsers = ref([]);

// 將時間格式化為可讀的格式
const formatTime = (timeString) => {
  if (!timeString) return "";
  const time = new Date(timeString);
  return time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
// 监视 messages 数组的变化
watchEffect(() => {
  if (messages.value.length > 0 && messagesContainer.value) {
    // 在滚动条位置设置时加上额外的空间，这里使用 20px 作为示例
    messagesContainer.value.scrollTop =
      messagesContainer.value.scrollHeight + 20;
  }
});

// Watch for roomId changes
watch(
  () => props.roomId,
  async (newRoomId) => {
    if (newRoomId != null) {
      messages.value = []; // 清空當前訊息列表
      await loadMessages(newRoomId); // 重新加載新房間的訊息
    }
  },
  { immediate: true }
);

watch(
  () => props.roomId,
  async (newRoomId) => {
    if (newRoomId != null) {
      await fetchRoomUsers(newRoomId);
    }
  },
  { immediate: true }
);

// 监视 roomId 的改变，先离开旧房间，再加入新房间
watch(
  () => props.roomId,
  async (newRoomId, oldRoomId) => {
    console.log(
      `Current user: ${userInfo.value.username}, New Room ID: ${newRoomId}, Old Room ID: ${oldRoomId}`
    );

    // 当从未选择房间状态切换到具体房间时，跳过离开房间的步骤
    if (userInfo.value && oldRoomId) {
      // 先从旧房间离开
      try {
        await axios.post(
          `${import.meta.env.VITE_HOST_URL}/user-to-room/remove`,
          {
            username: userInfo.value.username,
            roomId: oldRoomId,
          }
        );
      } catch (error) {
        console.error("離開舊房間時發生錯誤", error);
      }
    }

    if (userInfo.value && newRoomId) {
      // 加入新房间
      try {
        await axios.post(`${import.meta.env.VITE_HOST_URL}/user-to-room/add`, {
          username: userInfo.value.username,
          roomId: newRoomId,
        });
      } catch (error) {
        console.error("加入新房間時發生錯誤", error);
      }
    }
  },
  { immediate: true }
);

onMounted(async () => {
  // 检查会话状态
  try {
    const sessionResponse = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/check-session`);
    console.log(sessionResponse.data);
    if (sessionResponse.data === "0") {
      // 如果用户未登录（会话检查返回0），重定向到登录页面
      window.location.href = '/login'; // 使用window.location.href进行重定向
    }
  } catch (error) {
    console.error("会话检查失败:", error);
  }
  const userInfoStr = localStorage.getItem("userInfo"); // 從 localStorage 獲取用戶信息
  if (userInfoStr) {
    userInfo.value = JSON.parse(userInfoStr); // 解析並存儲用戶信息
  }
  connectStomp();
  await loadMessages();
});
// 組件卸載前執行
onBeforeUnmount(() => {
  if (stompClient && isConnected) {
    stompClient.disconnect(() => console.log("STOMP 客戶端已斷開連接。"));
  }
});
// WebSocket 服務器的 URL
const SOCKET_URL = `${import.meta.env.VITE_HOST_URL}/ws-message`;
// 是否已連接到 WebSocket 服務器
let isConnected = false;
// 連接 STOMP
const connectStomp = () => {
  const socket = new SockJS(SOCKET_URL, null, {
    transports: ["websocket", "xhr-streaming", "xhr-polling"],
    withCredentials: true,
  });
  stompClient = Stomp.over(socket);
  stompClient.reconnect_delay = 5000;

  stompClient.connect(
    {},
    (frame) => {
      isConnected = true;
      console.log("已連接至 STOMP!");
      // 订阅消息
      stompClient.subscribe("/topic/message", (msg) => {
        onStompMessageReceived(msg);

        // 解析收到的消息
        const messageData = JSON.parse(msg.body);
        // 检查消息类型
        if (messageData.type === "JOIN" || messageData.type === "LEAVE") {
          // 如果有人加入或离开，更新用户列表
          fetchRoomUsers(props.roomId);
        }
      });
    },
    (error) => {
      console.error("WebSocket 發生錯誤:", error);
    }
  );
};
// 接收到 STOMP 訊息時的處理函式
const onStompMessageReceived = (msg) => {
  const messageData = JSON.parse(msg.body);
  messages.value.push(messageData);
};
// 發送訊息
const sendMessage = () => {
  if (inputMessage.value.trim() !== "" && stompClient && isConnected) {
    const messageToSend = {
      username: currentUserUsername.value, // 當前使用者
      message: inputMessage.value, // 輸入的訊息
      roomId: props.roomId, // 當前房間ID
      type: "TEXT",
    };
    stompClient.send("/app/message", {}, JSON.stringify(messageToSend));
    inputMessage.value = "";
  } else {
    console.error("STOMP 連接尚未建立。");
  }
};
// 判斷是否為當前使用者的訊息
const isMyMessage = (msgUsername) => {
  return msgUsername.split("@")[0] === currentUserUsername.value;
};

// 加入房間
const joinRoom = async (roomId) => {
  if (roomId == null || !userInfo.value) {
    console.error("未選擇聊天室，或用戶信息不完整，無法加入。");
    return;
  }
  console.log(
    `加入房間。使用者名稱：${userInfo.value.username}，房間ID：${roomId}`
  );

  const joinMessage = {
    username: userInfo.value.username,
    message: `${currentUserUsername.value} 已加入`,
    roomId: roomId,
    type: "JOIN",
  };

  // 發送加入房間的消息
  stompClient.send("/app/message", {}, JSON.stringify(joinMessage));

  try {
    await axios.post(`${import.meta.env.VITE_HOST_URL}/user-to-room/add`, {
      username: userInfo.value.username,
      roomId: roomId,
    });
  } catch (error) {
    console.error("加入新房間時發生錯誤", error);
  }

  await fetchRoomUsers(roomId); // 獲取房間內的用戶列表
};

// 離開房間
const leaveRoom = async (roomId) => {
  if (!props.roomId || !userInfo.value) {
    console.error("未選擇聊天室，或用戶信息不完整，無法離開。");
    return;
  }

  console.log(
    `離開房間。使用者名稱：${userInfo.value.username}，房間ID：${props.roomId}`
  );

  const leaveMessage = {
    username: userInfo.value.username,
    message: `${currentUserUsername.value} 已離開`,
    roomId: props.roomId,
    type: "LEAVE",
  };

  // 發送離開房間的消息
  stompClient.send("/app/message", {}, JSON.stringify(leaveMessage));

  try {
    await axios.post(`${import.meta.env.VITE_HOST_URL}/user-to-room/remove`, {
      username: userInfo.value.username,
      roomId: roomId,
    });
  } catch (error) {
    console.error("離開房間時發生錯誤", error);
  }

  await fetchRoomUsers(roomId); // 更新房間內的用戶列表

  // 通知父組件房間已離開
  emit("roomLeft");
};

defineExpose({
  joinRoom,
  leaveRoom,
});

// 載入歷史訊息
const loadMessages = async (roomId) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/get-messages`,
      { roomId }
    );
    const historyMessages = response.data;

    // 將歷史訊息與當前訊息合併，並按時間排序
    messages.value = [...historyMessages, ...messages.value].sort(
      (a, b) => new Date(a.time) - new Date(b.time)
    );
  } catch (error) {
    console.error("載入訊息時發生錯誤:", error);
  }
};


const fetchRoomUsers = async (roomId) => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/user-to-room/get-by-room`,
      { roomId: roomId }
    );
    roomUsers.value = response.data;
  } catch (error) {
    console.error("獲取房間用戶時發生錯誤:", error);
  }
};
</script>

<style>
.room-container {
  display: flex;
  /* 使用 Flexbox 佈局 */
  align-items: flex-start;
  /* 頂部對齊 */
}

.room-content {
  display: flex;
  /* 也使用 Flexbox 佈局來並排顯示 .room 和 .user-sidebar */
  flex: 1;
  /* 確保它填充父容器的剩餘空間 */
  overflow-y: auto;
  /* 內容過多時可滾動 */
}

.room {
  flex: 1;
  /* 確保聊天室內容填充可用空間 */
  overflow-y: auto;
  /* 內容過多時可滾動 */
}

.user-sidebar {
  width: 100px;
  /* 用戶列表側邊欄寬度 */
  background-color: #2c3e50;
  /* 背景色 */
  margin-left: 20px;
  /* 與聊天室內容間距 */
  padding: 10px;
  /* 內邊距 */
  overflow-y: auto;
  /* 內容過多時可滾動 */
}

.user-entry {
  margin-bottom: 10px;
  /* 用戶條目間距 */
  padding: 5px;
  /* 用戶條目內邊距 */
  background-color: #10bd3b;
  /* 用戶條目背景色 */
  border-radius: 5px;
  /* 圓角 */
}

.system-message {
  text-align: center;
  color: #888;
}

.messages {
  display: flex;
  flex-direction: column;
  padding: 10px;
  overflow-y: auto;
  /* 如果訊息太多，允許滾動 */
  height: 500px;
  /* 根據需要調整高度 */
}

.message {
  max-width: 80%;
  margin-bottom: 10px;
  padding: 10px;
  border-radius: 15px;
  /* 圓角邊框 */
  word-wrap: break-word;
  /* 避免長訊息溢出 */
}

.my-message {
  align-self: flex-end;
  /* 將個人訊息靠右顯示 */
  background-color: #3498db;
  /* 個人訊息的背景色 */
  color: white;
  /* 文本顏色 */
}

.other-message {
  align-self: flex-start;
  /* 將他人的訊息靠左顯示 */
  background-color: #ecf0f1;
  /* 他人訊息的背景色 */
  color: #2c3e50;
  /* 文本顏色 */
}

.message-time {
  display: block;
  font-size: 0.75em;
  margin-top: 5px;
  color: #bdc3c7;
  /* 時間戳顏色 */
}

/* 美化輸入區域 */
.input-area {
  display: flex;
  margin-top: 10px;
}

input[type="text"] {
  flex-grow: 1;
  /* 輸入框填充剩餘空間 */
  padding: 10px;
  border-radius: 20px;
  /* 圓角邊框 */
  border: 1px solid #bdc3c7;
  margin-right: 10px;
  /* 與傳送按鈕的間距 */
}

button {
  padding: 10px 20px;
  border-radius: 20px;
  /* 圓角按鈕 */
  background-color: #3498db;
  /* 按鈕背景色 */
  color: white;
  /* 文本顏色 */
  border: none;
  /* 移除邊框 */
  cursor: pointer;
  /* 鼠標懸停時顯示手型指針 */
}

button:hover {
  background-color: #2980b9;
  /* 鼠標懸停時的背景色 */
}

.leave-btn {
  background-color: #e74c3c;
  /* 設置為紅色背景 */
}

.leave-btn:hover {
  background-color: #c0392b;
  /* 鼠標懸停時的背景色變深 */
}

.no-room-selected {
  text-align: center;
  margin-top: 50px;
  /* 或根據需要調整 */
  font-size: 18px;
  /* 或根據需要調整 */
  color: #bdc3c7;
  /* 或根據需要調整 */
}
</style>
