import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: {
    "Content-Type": "application/json",
    "accept": "application/json",
  }
});

export const api = {
  auth: async (req) => {
    const response = await apiClient.post("/auth/login", req);
    console.log(response.data);
  }
};