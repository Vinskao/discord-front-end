<!-- /src/components/Group.vue -->
<template>
  <div class="container">
    <div class="sidebar">
      <div v-for="room in rooms" :key="room.id" :class="{ 'selected-room': room.id === selectedRoomId }"
        @click="selectRoom(room.id)" class="room-entry">
        {{ room.name }}
      </div>
    </div>
    <div class="room">
      <Room :roomId="selectedRoomId" ref="roomComponent" @roomLeft="handleRoomLeft" />
    </div>
  </div>
</template>


<script setup>
import { ref, watch, onMounted } from "vue";
import Room from "../components/Room.vue";
import axios from "axios";
axios.defaults.withCredentials = true;

const props = defineProps({
  groupId: Number // 接收一個名為 groupId 的 prop，類型為 Number
});
const rooms = ref([]);
const selectedRoomId = ref(null);
const roomComponent = ref(null);

onMounted(async () => {
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

  // 加载群组房间信息
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/room/find-all-rooms`
    );
    rooms.value = response.data;
  } catch (error) {
    console.error("無法獲取聊天室:", error);
  }
});

// 當 groupId 改變時，獲取相應的房間
watch(() => props.groupId, async (newGroupId) => {
  if (newGroupId !== null) {
    try {
      const response = await axios.post(`${import.meta.env.VITE_HOST_URL}/room/find-all-rooms`, {
        groupId: newGroupId
      });
      rooms.value = response.data;
    } catch (error) {
      console.error("無法獲取聊天室:", error);
    }
  }
}, { immediate: true });


const handleRoomLeft = () => {
  selectedRoomId.value = null;
};

const selectRoom = async (id) => {
  console.log("Selected Room ID: ", id);

  // 如果已经选择了房间且不是当前房间，则先离开当前房间
  if (selectedRoomId.value && selectedRoomId.value !== id && roomComponent.value && typeof roomComponent.value.leaveRoom === "function") {
    await roomComponent.value.leaveRoom(selectedRoomId.value);
  }

  // 更新 selectedRoomId 为新选中的房间ID
  selectedRoomId.value = id;

  // 确保 Room 组件已加载并且 joinRoom 方法可用
  if (roomComponent.value && typeof roomComponent.value.joinRoom === "function") {
    roomComponent.value.joinRoom(id);
  } else {
    console.error("joinRoom 方法不可用");
  }
};
</script>
<style>
.container {
  display: flex;
}

.sidebar {
  flex: 1;
  background-color: #2c3e50;
  color: #fff;
  overflow-y: auto;
}

.room-entry {
  padding: 10px 15px;
  margin: 5px 0;
  border-radius: 5px;
  transition: background-color 0.3s;
  cursor: pointer;
}

.room-entry:hover {
  background-color: #34495e;
}

.room {
  flex: 5;
  background-color: #1b1e1f;
  overflow-y: auto;
}

.selected-room {
  background-color: #2980b9;
  color: #fff;
}
</style>
