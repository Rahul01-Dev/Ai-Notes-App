// src/api/notes.js
// Notes API calls

import api from "./axios";

export const getNotes     = ()           => api.get("/api/notes");
export const createNote   = (data)       => api.post("/api/notes", data);
export const updateNote   = (id, data)   => api.put(`/api/notes/${id}`, data);
export const deleteNote   = (id)         => api.delete(`/api/notes/${id}`);
export const askAI        = (id, question) =>
  api.post(`/api/notes/${id}/ask`, { question });
