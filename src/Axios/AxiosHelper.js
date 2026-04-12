import axios from "axios";

export const baseUrl = process.env.REACT_APP_API_BASE_URL;

export const httpClient = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});