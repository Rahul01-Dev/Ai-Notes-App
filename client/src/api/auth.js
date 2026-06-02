// src/api/auth.js
// Auth API calls — register & login

import api from "./axios";

export const registerUser = (data) => api.post("/api/auth/register", data);
export const loginUser    = (data) => api.post("/api/auth/login", data);
