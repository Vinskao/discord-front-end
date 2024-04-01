<!-- /src/components/Group.vue -->
<template>
  <div class="container">
    <div class="sidebar">
      <div
        v-for="room in rooms"
        :key="room.id"
        :class="{ 'selected-room': room.id === selectedRoomId }"
        @click="selectRoom(room.id)"
        class="room-entry"
      >
        {{ room.name }}
      </div>
    </div>
    <div class="room">
      <Room
        :roomId="selectedRoomId"
        ref="roomComponent"
        @roomLeft="handleRoomLeft"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Room from "../components/Room.vue";
import axios from "axios";

const rooms = ref([]);
const selectedRoomId = ref(null);
const roomComponent = ref(null);

onMounted(async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/room/find-all-rooms`
    );
    rooms.value = response.data;
  } catch (error) {
    console.error("無法獲取聊天室:", error);
  }
});

const handleRoomLeft = () => {
  selectedRoomId.value = null;
};

const selectRoom = (id) => {
  selectedRoomId.value = id;

  if (
    roomComponent.value &&
    typeof roomComponent.value.joinRoom === "function"
  ) {
    roomComponent.value.joinRoom(id);
  } else {
    console.error("joinRoom 方法不可用");
  }
};
</script>
<style>
/* 使用Flexbox布局 */
.container {
  display: flex;
}

.sidebar {
  flex: 1;
  background-color: #2c3e50; /* 深藍色背景 */
  color: #fff; /* 白色文本 */
  overflow-y: auto; /* 如果聊天室太多，允許滾動 */
}

.room-entry {
  padding: 10px 15px; /* 增加內邊距讓條目更易點擊和閱讀 */
  margin: 5px 0; /* 添加上下邊距來分隔條目 */
  border-radius: 5px; /* 添加圓角 */
  transition: background-color 0.3s; /* 平滑過渡效果 */
  cursor: pointer; /* 鼠標懸停時顯示手型指針 */
}
.room-entry:hover {
  background-color: #34495e; /* 鼠標懸停時的背景顏色 */
}
.room {
  flex: 5;
  background-color: #1b1e1f; /* 淺灰色背景 */
  overflow-y: auto; /* 允許滾動 */
}

.selected-room {
  background-color: #2980b9; /* 選中聊天室的背景色 */
  color: #fff; /* 選中聊天室的文字顏色 */
}
</style>
