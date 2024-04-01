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
      <Group :groupId="selectedGroupId" />
      <button @click="deselectGroup">Back</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import Layout from "../layouts/Layout.vue";
import Group from "../components/Group.vue";
import axios from "axios";

const groups = ref([]);
const selectedGroupId = ref(null);

onMounted(async () => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/groups/find-all-groups`
    );
    groups.value = response.data;
  } catch (error) {
    console.error("Failed to fetch groups:", error);
  }
});

const selectGroup = async (groupId) => {
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
  /* Add more styles for your group entries here */
}
</style>
