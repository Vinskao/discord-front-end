<template>
  <Layout />

  <div class="l1">
    <!-- 顯示部門信息 -->
    <h5>選擇要操作的部門</h5>
    <div class="unit-container">
      <ul v-if="units.length" class="unit-list">
        <li v-for="unit in units" :key="unit.id" @click="handleUnitClick(unit.id)" class="unit-item">
          {{ unit.id }} - {{ unit.name }}
        </li>
      </ul>
      <div v-if="error">{{ error }}</div>
    </div>
  </div>
  <div class="l2">
    <!-- 新增資產表格 -->
    <div class="add-asset-container">
      <h5>新增資產</h5>
      <button @click="toggleAddForm" class="toggle-add-form-btn">
        {{ showAddForm ? "隱藏表格" : "顯示表格" }}
      </button>
      <div v-if="showAddForm" class="add-asset-form">
        <table class="add-asset-table">
          <thead>
            <tr>
              <th>資產編號</th>
              <th>資產名稱</th>
              <th>使用部門</th>
              <th>部門編號</th>
              <th>使用人</th>
              <th>創建日期</th>
              <th>價值</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><input v-model="newAsset.assetNumber" type="text" /></td>
              <td><input v-model="newAsset.assetName" type="text" /></td>
              <td>
                <input v-model="newAsset.unitOfUse" type="text" readonly />
              </td>
              <td>
                <input v-model="newAsset.unitId" type="text" readonly />
              </td>
              <td><input v-model="newAsset.user" type="text" readonly /></td>
              <td><input v-model="newAsset.creationDate" type="date" /></td>
              <td><input v-model="newAsset.value" type="number" /></td>
              <td><button @click="addNewAsset">確定</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
  <div class="l3">
    <!-- 顯示資產信息 -->
    <div v-if="assets.length" class="asset-container">
      <h5>部門資產列表</h5>
      <p style="color: red">請注意：更改完請點擊“修改”按鈕後再按“確定”</p>

      <table class="asset-table">
        <thead>
          <tr>
            <th>資產編號</th>
            <th>資產名稱</th>
            <th>使用部門</th>
            <th>使用人</th>
            <th>創建日期</th>
            <th>價值</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="asset in assets" :key="asset.id">
            <td>
              <input v-model="asset.assetNumber" type="text" disabled />
            </td>
            <td>
              <input v-model="asset.assetName" type="text" :disabled="!editingAsset" />
            </td>
            <td>
              <input v-model="asset.unitOfUse" type="text" :disabled="!editingAsset" />
            </td>
            <td>
              <input v-model="asset.user" type="text" :disabled="!editingAsset" />
            </td>
            <td>
              <input v-model="asset.creationDate" type="date" :disabled="!editingAsset" />
            </td>
            <td>
              <input v-model="asset.value" type="number" :disabled="!editingAsset" />
            </td>
            <td>
              <button @click="editAsset(asset)">修改</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="editingAsset">
        <button @click="confirmEdit">確定</button>
      </div>
    </div>
  </div>
  <div v-if="selectedUnit" class="l4">
    <h5>產生 Excel 檔案</h5>
    <button @click="generateExcel">產生</button>
  </div>
  <div class="l5">
    <h5>上傳 CSV 檔案</h5>
    <input type="file" @change="handleFileUpload" accept=".csv" />
    <button @click="uploadCSV">上傳</button>
  </div>
</template>

<script setup>
import Layout from "../layouts/Layout.vue";
import axios from "axios";
import Swal from "sweetalert2";
import { ref, onMounted } from "vue";

const units = ref([]);
const error = ref("");
const assets = ref([]);
const editingAsset = ref(null);
const selectedUnit = ref(false);

const newAsset = ref({
  assetNumber: "",
  assetName: "",
  unitOfUse: localStorage.getItem("unitOfUse"),
  unitId: localStorage.getItem("unitId"),
  user: localStorage.getItem("user"),
  creationDate: "",
  value: 0,
});
const showAddForm = ref(false);

async function updateNewAssetFromLocalStorage() {
  newAsset.value.unitOfUse = localStorage.getItem("unitOfUse");
  newAsset.value.unitId = localStorage.getItem("unitId");
}

onMounted(async () => {
  try {
    Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    await updateNewAssetFromLocalStorage();
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/units/find-all`
    );
    units.value = response.data;
    console.log(units.value);

    Swal.close();
  } catch (err) {
    Swal.close();
    error.value = "獲取部門信息時發生錯誤。";
  }
});

const handleUnitClick = async (unitId) => {

  localStorage.setItem("unitId", unitId);
  // 在localStorage存id + name ， 傳入 newAsset ref
  try {
    const responseId = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/units/findById`,
      {
        unitId: unitId,
      }
    );
    const dataId = responseId.data[0];

    if (dataId) {
      console.log("dataId 不為空");

      newAsset.value.unitId = dataId.id;
      newAsset.value.unitOfUse = dataId.name;

      localStorage.setItem("unitId", dataId.id);
      localStorage.setItem("unitOfUse", dataId.name);
    } else {
      console.error("沒有從 responseId.data[0] 中獲取到有效Data");
    }
  } catch (error) {
  }
  // 使用unitId顯示部門下的資產 
  try {
    Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/assets/select-by-unit-id`,
      {
        unitId: unitId,
      }
    );
    assets.value = response.data;
    Swal.close();
  } catch (error) {
    Swal.close();
    error.value = "獲取選定部門的資產時發生錯誤。";
  }
  selectedUnit.value = true

};

const editAsset = (asset) => {
  // 將編輯中的資產設置為點擊的資產
  editingAsset.value = { ...asset };
};

const confirmEdit = async () => {
  try {
    Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await axios.post(
      `${import.meta.env.VITE_HOST_URL}/assets/update`,
      editingAsset.value
    );
    const updatedAssets = [...assets.value];
    const index = updatedAssets.findIndex(
      (item) => item.id === editingAsset.value.id
    );
    if (index !== -1) {
      updatedAssets[index] = editingAsset.value;
      assets.value = updatedAssets;
    }
    // 刷新資產列表
    await handleUnitClick(localStorage.getItem("unitId"));
    Swal.close();

    editingAsset.value = null;
  } catch (error) {
    Swal.close();
    error.value = "更新資產時發生錯誤。";
  }
};
const toggleAddForm = () => {
  showAddForm.value = !showAddForm.value;
};
const addNewAsset = async () => {
  try {
    Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    await axios.post(
      `${import.meta.env.VITE_HOST_URL}/assets/add`,
      newAsset.value
    );

    await handleUnitClick(localStorage.getItem("unitId"));

    Swal.fire("Success", "資產已成功新增。", "success");

    clearNewAssetForm();

    Swal.close();
  } catch (error) {
    Swal.fire("Error", "新增資產時發生錯誤。", "error");
    Swal.close();
  }
};

const clearNewAssetForm = () => {
  newAsset.value = {
    assetNumber: "",
    assetName: "",
    unitOfUse: "",
    user: "",
    creationDate: "",
    value: 0,
  };
};

const generateExcel = async () => {
  try {
    Swal.fire({
      title: "Loading...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const unitId = localStorage.getItem("unitId");
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/assets/select-by-unit-id/total`,
      { unitId: unitId },
      { responseType: "blob" }
    );
    // Blob URL 生成
    const blob = new Blob([response.data], { type: response.headers["content-type"] });
    const url = window.URL.createObjectURL(blob);

    // 創建 <a> label 用於下載
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "assets.xlsx");
    document.body.appendChild(link);
    link.click();
    // Blob URL 移除
    window.URL.revokeObjectURL(url);
    Swal.close();
  } catch (error) {
    Swal.fire("Error", "產生Excel檔案時發生錯誤。", "error");
    Swal.close();
  }
}

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  assets.csv = file;
}

const uploadCSV = async () => {
  try {
    const formData = new FormData();
    formData.append("csvFile", assets.csv); // 使用 FormData 将文件包装
    Swal.fire({
      title: "Uploading...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
    const response = await axios.post(
      `${import.meta.env.VITE_HOST_URL}/assets/add-from-csv`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    Swal.fire("Success", response.data, "success");
    clearUploadedFile();
    Swal.close();
  } catch (error) {
    Swal.fire("Error", "上傳 CSV 文件操作錯誤。", "error");
    Swal.close();
  }

}

const clearUploadedFile = () => {
  assets.csv = null;
};

</script>

<style>
h5 {
  z-index: 9999;
}

.page-title {
  margin-top: 0;
}

.unit-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-gap: 10px;
}

.unit-item {
  border: 1px solid #ccc;
  border-radius: 5px;
  margin-bottom: 10px;
  padding: 10px;
  cursor: pointer;
}

.unit-item:hover {
  background-color: #7c90a8;
}

.page-title {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
}

.asset-table {
  width: 100%;
  border-collapse: collapse;
  border-spacing: 0;
}

.asset-table th,
.asset-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.asset-table th {
  background-color: #671a1a;
}

.asset-table tr:nth-child(even) {
  background-color: #461d1d;
}

.asset-table tr:hover {
  background-color: #3b7493;
}

.l1,
.l2,
.l3,
.l4,
.l5 {
  border-bottom: 2px solid #554f4f;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.add-asset-container {
  margin-bottom: 20px;
}

.add-asset-container h5 {
  margin-bottom: 10px;
}

/* 按鈕樣式 */
.toggle-add-form-btn {
  background-color: #4caf50;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}


/* 表格樣式 */
.add-asset-table {
  width: 100%;
  border-collapse: collapse;
}

.add-asset-table th,
.add-asset-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.add-asset-table th {
  background-color: #0471dd56;
}

.add-asset-table tr:nth-child(even) {
  background-color: #f2f2f2;
}

.add-asset-table tr:hover {
  background-color: #580000;
}

/* 表單輸入框樣式 */
.add-asset-table input[type="text"],
.add-asset-table input[type="date"],
.add-asset-table input[type="number"] {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

/* 確定按鈕樣式 */
.add-asset-table button {
  background-color: #010057;
  color: white;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

.add-asset-table button:hover {
  background-color: #ee0053d1;
}

/* 隱藏表格樣式 */
.add-asset-form {
  margin-top: 10px;
}
</style>
