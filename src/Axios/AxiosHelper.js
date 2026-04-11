import axios from "axios";

export const baseUrl = "http://localhost:8080/api";

export const httpClient = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});