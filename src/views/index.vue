<!-- /src/views/Index.vue -->
<template>
  <div>
    <Layout />

    <div v-if="selectedGroupId === null">
      <!-- 群组列表 -->
      <div v-for="group in groups" :key="group.id" @click="selectGroup(group.id)" class="group-entry">
        {{ group.name }}
      </div>
    </div>
    <div v-else>
      <Group :groupId="selectedGroupId" />
      <button @click="deselectGroup">Back</button>
    </div>



  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import Layout from "../layouts/Layout.vue";
import Group from "../components/Group.vue";
import axios from "axios";

axios.defaults.withCredentials = true;
const router = useRouter();
const groups = ref([]);
const selectedGroupId = ref(null);
const isLoggedIn = ref(false);
onMounted(async () => {
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

// 检查用户会话的函数
const checkSession = async () => {
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
};

const selectGroup = async (groupId) => {
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
