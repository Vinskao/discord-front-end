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
              <strong>{{ msg.username ? msg.username.split("@")[0] : '' }}：</strong>
              {{ msg.message }}
              <span class="message-time">{{ formatTime(msg.time) }}</span>
            </div>
          </div>
        </div>

        <div class="input-area">
          <input type="text" v-model="inputMessage" placeholder="請輸入訊息..." />
          <button @click="sendMessage" :disabled="!isMessageValid">傳</button>
          <button @click="leaveRoom(props.roomId)" class="leave-btn">離</button>
        </div>
      </div>

      <div class="user-sidebar">
        <div v-for="user in roomUsers" :key="user.username" class="user-entry">
          {{ user.username.split("@")[0] }}
        </div>
      </div>
      <!-- <div class="user-sidebar">
        <div v-for="user in connectedUsers" :key="user" class="user-entry">
          {{ user.split("@")[0] }}
        </div>
      </div> -->
    </div>
  </div>
  <button v-if="canExportChatHistory" @click="exportChatHistory">聊天紀錄下載</button>

</template>
<script setup>
import { ref, watch, watchEffect, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import SockJS from "sockjs-client/dist/sockjs.min.js";
import { Stomp } from "@stomp/stompjs";
import axios from "axios";
import Swal from 'sweetalert2';
import { onBeforeRouteLeave } from 'vue-router';

axios.defaults.withCredentials = true;
const connectedUsers = ref([]);
const currentRoomId = ref(null);
const canExportChatHistory = ref(false);
const messagesContainer = ref(null);
const userInfo = ref(null);
const currentUserUsername = ref("");
const emit = defineEmits(["roomLeft"]);
const messages = ref([]);
const inputMessage = ref("");
let stompClient = null;
const roomUsers = ref([]);
const userInfoStr = localStorage.getItem("userInfo");

if (userInfoStr) {
  const userInfo = JSON.parse(userInfoStr);
  currentUserUsername.value = userInfo.username.split("@")[0];
}

const props = defineProps({
  roomId: Number,
});

const isMessageValid = computed(() => {
  return inputMessage.value.trim().length > 0;
});

// 將時間格式化為可讀的格式
const formatTime = (timeString) => {
  if (!timeString) return "";
  const time = new Date(timeString);
  return time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// 三種方法確保在任何方式離開聊天室都會觸發leaveRoom
window.addEventListener('beforeunload', () => {
  if (props.roomId && currentUserUsername.value) {
    leaveRoom(props.roomId);
  }
});
onBeforeRouteLeave((to, from) => {
  if (props.roomId && currentUserUsername.value) {
    leaveRoom(props.roomId);
  }
});
window.addEventListener('beforeunload', () => {
  if (props.roomId && currentUserUsername.value) {
    const leaveMessage = {
      username: currentUserUsername.value,
      roomId: props.roomId,
      type: "LEAVE",
    };
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/app/message", false); // 第三个参数 false 表示同步请求
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify(leaveMessage));
  }
});


// 监视 messages 数组的变化
watchEffect(() => {
  if (messages.value.length > 0 && messagesContainer.value) {
    // 等待 Vue 更新 DOM
    nextTick(() => {
      // 滚动到 messagesContainer 元素的底部
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    });
  }
});

const changeRoom = async (newRoomId) => {

  if (newRoomId) {
    currentRoomId.value = newRoomId;  // 更新 currentRoomId
    await joinRoom(newRoomId);  // 加入新房间的逻辑
  }
  console.log("完成join api", newRoomId)

};

watch(currentRoomId, async (newRoomId, oldRoomId) => {
  if (newRoomId !== oldRoomId) {
    await changeRoom(newRoomId);
  }
}, { immediate: true });


// watch(
//   () => props.roomId,
//   (newRoomId, oldRoomId) => {
//     // 直接使用防抖处理后的函数来处理 roomId 的变化
//     handleRoomChange(newRoomId, oldRoomId);
//   },
//   { immediate: true }
// );
// watch(
//   () => props.roomId,
//   async (newRoomId) => {
//     if (newRoomId != null) {
//       await fetchRoomUsers(newRoomId);
//     }
//   },
//   { immediate: true }
// );


// watch(
//   () => props.roomId,
//   (newRoomId) => {
//     if (newRoomId) {
//       // roomId 有效，执行操作
//       loadMessages(newRoomId);
//       fetchRoomUsers(newRoomId);
//       reconnectStompAndSubscribe(newRoomId);
//     } else {
//       // roomId 无效，处理逻辑（例如清除数据或显示提示信息）
//       messages.value = [];
//       roomUsers.value = [];
//     }
//   },
//   { immediate: true }
// );


// watch(
//   () => props.roomId,
//   (newRoomId, oldRoomId) => {
//     console.log(`Room changed from ${oldRoomId} to ${newRoomId}`);
//     if (newRoomId) {
//       reconnectStompAndSubscribe(newRoomId);
//     }
//   },
//   { immediate: true }
// );
let stompSubscription = null;
// 重新连接STOMP并订阅新房间的主题
const reconnectStompAndSubscribe = (newRoomId) => {
  if (stompClient && isConnected) {
    if (stompSubscription) {
      stompSubscription.unsubscribe();
    }
    // 订阅接收消息的主题
    stompSubscription = stompClient.subscribe(`/topic/message/${newRoomId}`, (msg) => {
      const messageData = JSON.parse(msg.body);
      // 当用户加入时，将其添加到 connectedUsers
      if (messageData.type === "JOIN") {
        connectedUsers.value.push(messageData.username);
      }
      // 当用户离开时，从 connectedUsers 中移除
      else if (messageData.type === "LEAVE") {
        const index = connectedUsers.value.indexOf(messageData.username);
        if (index > -1) {
          connectedUsers.value.splice(index, 1);
        }
      }

      // if (messageData.type === "USER_LIST") {
      //   // 假设后端发送的消息体中包含了用户列表，字段名为 message
      //   connectedUsers.value = messageData.message.split(','); // 将字符串分割成数组
      // }
      onStompMessageReceived(msg);
    });

    // 订阅用户列表更新的主题
    stompClient.subscribe('/topic/message', (message) => {
      const updatedUserList = JSON.parse(message.body);
      connectedUsers.value = updatedUserList; // 使用 Vue 3 的 Composition API
    });
  }
};

onMounted(async () => {
  console.log("Room ID in Room Component: ", props.roomId);
  currentRoomId.value = props.roomId
  // 检查会话状态
  try {
    const userInfoResponse = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/me`);
    // 如果请求成功，说明用户已登录，可以继续加载群组房间信息
    console.log("User info:", userInfoResponse.data);

    // 这里可以添加额外的逻辑，例如如果 userInfoResponse.data 为空，则判定为未登录
    if (!userInfoResponse.data || Object.keys(userInfoResponse.data).length === 0) {
      throw new Error('No user info returned'); // 抛出错误以便在 catch 块中处理
    }
  } catch (error) {
    console.error("用户未登录或会话已过期:", error);
    router.push('/login');
  }

  try {
    const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/user/me`);
    // 假设权限字段是 'authorities'，且 'ADMIN' 有权限导出聊天记录
    canExportChatHistory.value = response.data.authorities === 'ADMIN';
  } catch (error) {
    console.error('Error fetching user info:', error);
    // 可以根据错误处理逻辑进一步处理，例如错误提示或重定向
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
    if (stompSubscription) {
      stompSubscription.unsubscribe();
    }
    stompClient.disconnect(() => {
      console.log("STOMP client disconnected.");
    });
  }
});
// WebSocket 服務器的 URL
const SOCKET_URL = `${import.meta.env.VITE_HOST_URL}/ws-message`;
// 是否已連接到 WebSocket 服務器
let isConnected = false;
// 連接 STOMP
const connectStomp = () => {
  const socket = new SockJS(SOCKET_URL);
  stompClient = Stomp.over(socket);
  console.log("Attempting to connect to STOMP with roomId:", props.roomId);

  stompClient.connect(
    { "roomId": props.roomId },
    (frame) => {
      isConnected = true;
      console.log("已連接至 STOMP!");
      // 订阅消息
      stompClient.subscribe(`/topic/message/${props.roomId}`, (msg) => {
        console.log("Received message: ", msg);

        onStompMessageReceived(msg);


        const messageData = JSON.parse(msg.body);
        // 检查消息类型
        if (messageData.type === "JOIN" || messageData.type === "LEAVE") {
          // 如果有人加入或离开，更新用户列表
          fetchRoomUsers(props.roomId);
        }
      });
      // 监听 WebSocket 连接关闭事件
      socket.onclose = () => {
        console.log("WebSocket 连接已关闭，尝试自动离开房间");
        // 调用 leaveRoom 方法
        if (props.roomId && userInfo.value) {
          leaveRoom(props.roomId);
        }

        router.push('/login');
      };
    },
    (error) => {
      console.error("WebSocket 發生錯誤:", error);
    }
  );
};
// 接收到 STOMP 訊息時的處理函式
const onStompMessageReceived = (msg) => {
  console.log("New message received:", msg);
  const messageData = JSON.parse(msg.body);

  // 检查消息类型并相应地处理
  switch (messageData.type) {
    case 'TEXT':
      // 处理文本消息
      messages.value.push(messageData);
      break;
    case 'JOIN':
      // 处理加入房间的消息
      messages.value.push(messageData);
      fetchRoomUsers(props.roomId); // 刷新房间用户列表
      break;
    case 'LEAVE':
      messages.value.push(messageData);
      // 从 roomUsers 中移除离开的用户
      const userIndex = roomUsers.value.findIndex(user => user.username === messageData.username);
      if (userIndex !== -1) {
        roomUsers.value.splice(userIndex, 1);
      }
      break;
    default:
      console.warn('Received unknown message type:', messageData.type);
  }
};
// 發送訊息
const sendMessage = () => {
  if (inputMessage.value.trim() !== "" && stompClient) {
    if (stompClient.connected) {
      const messageToSend = {
        username: currentUserUsername.value, // 当前用户
        message: inputMessage.value, // 输入的消息
        roomId: props.roomId, // 当前房间ID
        type: "TEXT", // 消息类型
      };

      // 发送消息
      stompClient.send("/app/message", {}, JSON.stringify(messageToSend));

      // 清空输入框
      inputMessage.value = "";
    } else {
      console.error("STOMP client is not connected.");
      // 可以在这里添加重新连接 STOMP 客户端的逻辑或显示一些用户反馈
    }
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

  console.log(`加入房間。使用者名稱：${userInfo.value.username}，房間ID：${roomId}`);
  messages.value = [];

  // 重新加载新房间的消息
  await loadMessages(roomId);

  // 获取新房间的用户列表
  await fetchRoomUsers(roomId);

  // 重新连接STOMP并订阅新房间的主题
  reconnectStompAndSubscribe(roomId);

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

  await nextTick(); // 等待 Vue 更新 DOM 或状态

  await fetchRoomUsers(roomId); // 獲取房間內的用戶列表
};

// 離開房間
const leaveRoom = async (roomId) => {
  if (!props.roomId || !userInfo.value) {
    console.error("未選擇聊天室，或用戶信息不完整，無法離開。");
    return;
  }

  console.log(`離開房間。使用者名稱：${userInfo.value.username}，房間ID：${props.roomId}`);

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

  await nextTick(); // 等待 Vue 更新 DOM 或状态

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

const exportChatHistory = async () => {
  console.log(`Exporting chat history for room ID: ${props.roomId}`);

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/export-chat-history`,
      { roomId: props.roomId },
      { responseType: 'blob' }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `chat_history_room_${props.roomId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('Chat history download initiated.');
  } catch (error) {
    console.error("Error exporting chat history:", error);
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: '你沒有權限喔!',
    });
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
