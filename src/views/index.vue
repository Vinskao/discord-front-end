<!-- /src/views/Index.vue -->
<template>
  <div>
    <Layout />

    <div v-if="selectedGroupId === null">
      <!-- 群组列表 -->
      <div
        v-for="group in groups"
        :key="group.id"
        @click="selectGroup(group.id)"
        class="group-entry"
      >
        {{ group.name }}
      </div>
    </div>
    <div v-else>
      <Group
        :groupId="selectedGroupId"
        :onLeave="deselectGroup"
        ref="groupComponent"
        @roomSelected="() => toggleBackButton(false)"
        @roomDeselected="() => toggleBackButton(true)"
      />
      <button v-if="showBackButton" @click="deselectGroup">返回</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import Layout from "../layouts/Layout.vue";
import Group from "../components/Group.vue";
import axios from "axios";
import { onBeforeRouteLeave } from "vue-router";

axios.defaults.withCredentials = true;
const groupComponent = ref(null);
const router = useRouter();
const groups = ref([]);
const selectedGroupId = ref(null);
const showBackButton = ref(true);

const userInfoStr = localStorage.getItem("userInfo");
const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
const username = userInfo ? userInfo.username : null;

const props = defineProps({
  groupId: Number,
  onLeave: Function, // 接收一个名为 onLeave 的函数作为 prop
});

onBeforeRouteLeave((to, from) => {
  // 当导航离开当前路由执行
  deselectGroup();
});

window.addEventListener("beforeunload", (event) => {
  // 调用 deselectGroup 函数
  deselectGroup();

  // 在一些浏览器中，需要设置 returnValue 属性来触发确认对话框
  event.returnValue = "Are you sure you want to leave?";
});

onMounted(async () => {
  checkUserRooms();
  await checkSession();
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/groups/find-all-groups`
    );
    groups.value = response.data;
  } catch (error) {
    console.error("Failed to fetch groups:", error);
  }
});

const toggleBackButton = (isVisible) => {
  showBackButton.value = isVisible;
};

const checkUserRooms = async () => {
  if (!username) {
    console.error("Username is not available.");
    // 如果没有用户名，可能需要特殊处理，例如显示错误信息
    return;
  }

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/user-to-room/get-by-username`,
      {
        username: username,
      }
    );
    // 根据返回值决定是否显示返回按钮
    // 如果返回的房间列表为空，显示返回按钮
    showBackButton.value = response.data.length === 0;
  } catch (error) {
    console.error("Failed to fetch user rooms:", error);
    // 在出现错误时，您可以根据实际情况决定是否显示返回按钮
    showBackButton.value = true; // 例如，这里决定在错误时显示按钮
  }
};

// 检查用户会话的函数
const checkSession = async () => {
  // 检查会话状态
  try {
    const userInfoResponse = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/user/me`
    );
    // 如果请求成功，说明用户已登录，可以继续加载群组房间信息
    console.log("User info:", userInfoResponse.data);

    // 这里可以添加额外的逻辑，例如如果 userInfoResponse.data 为空，则判定为未登录
    if (
      !userInfoResponse.data ||
      Object.keys(userInfoResponse.data).length === 0
    ) {
      throw new Error("No user info returned"); // 抛出错误以便在 catch 块中处理
    }
  } catch (error) {
    console.error("用戶未登錄或session已過期:", error);
    router.push("/login");
  }
};

const selectGroup = async (groupId) => {
  // Ensure user leaves the current group before joining a new one
  if (selectedGroupId.value) {
    await deselectGroup();
  }

  console.log("Selected Group ID: ", groupId);
  selectedGroupId.value = groupId;

  const userInfoStr = localStorage.getItem("userInfo");
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
  const username = userInfo ? userInfo.username : null;

  if (!username) {
    console.error("Username is not available.");
    return;
  }

  try {
    await axios.post(`${import.meta.env.VITE_HOST_URL}/user-to-group/add`, {
      username: username,
      groupId: groupId,
    });
  } catch (error) {
    console.error("Failed to add user to group:", error);
  }
};
const deselectGroup = async () => {
  if (selectedGroupId.value !== null) {
    const userInfoStr = localStorage.getItem("userInfo");
    const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;
    const username = userInfo ? userInfo.username : null;

    if (!username) {
      console.error("Username is not available.");
      return;
    }

    // 确保调用子组件 Group 中的 leaveCurrentRoom 方法，而不是直接操作 Room 组件
    if (
      groupComponent.value &&
      typeof groupComponent.value.leaveCurrentRoom === "function"
    ) {
      await groupComponent.value.leaveCurrentRoom();
    }

    // 获取用户所在的所有房间
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_HOST_URL}/user-to-room/get-by-username`,
        { username: username }
      );
      const rooms = response.data;

      // 遍历所有房间并从每个房间中移除该用户
      for (const room of rooms) {
        await axios.post(
          `${import.meta.env.VITE_HOST_URL}/user-to-room/remove`,
          {
            username: username,
            roomId: room.roomId,
          }
        );
      }
    } catch (error) {
      console.error("Failed to remove user from rooms:", error);
    }

    // 离开群组的逻辑
    try {
      await axios.post(
        `${import.meta.env.VITE_HOST_URL}/user-to-group/remove`,
        {
          username: username,
          groupId: selectedGroupId.value,
        }
      );
      selectedGroupId.value = null;
    } catch (error) {
      console.error("Failed to remove user from group:", error);
    }
  }
};

watch(selectedGroupId, (newVal, oldVal) => {
  // Handle group change logic here, if necessary
});
</script>

<style>
.group-entry {
  cursor: pointer;
  padding: 10px 15px;
  /* 增加内边距以提供更多的点击空间和美观的布局 */
  margin: 5px 0;
  /* 为每个群组条目增加上下外边距以避免相互贴近 */
  border-radius: 5px;
  /* 添加边框圆角让元素更加圆润 */
  transition: background-color 0.3s ease;
  /* 添加背景颜色变化的渐变效果 */
}

.group-entry:hover {
  background-color: #641d1d;
  /* 鼠标悬停时的背景颜色 */
}

.group-entry:hover {
  font-weight: bold;
}
</style>
