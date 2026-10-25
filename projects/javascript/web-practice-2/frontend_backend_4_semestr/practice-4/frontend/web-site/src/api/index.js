import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    "accept": "application/json",
  }
});

export const api = {
  // Создание товара
  createProduct: async (product) => {
    const response = await apiClient.post("/units", product);
    return response.data;
  },

  // Получение всех товаров
  getProducts: async () => {
    const response = await apiClient.get("/units");
    return response.data;
  },

  // Получение товара по ID
  getProductById: async (id) => {
    const response = await apiClient.get(`/units/${id}`);
    return response.data;
  },

  // Обновление товара
  updateProduct: async (id, product) => {
    const response = await apiClient.patch(`/units/${id}`, product);
    return response.data;
  },

  // Удаление товара
  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/units/${id}`);
    return response.data;
  }
};