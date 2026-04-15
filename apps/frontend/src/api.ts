import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';

export const api = axios.create({ baseURL: API_BASE });

export const setToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const wsUrl = (token: string) => {
  const url = new URL(import.meta.env.VITE_WS_BASE_URL ?? 'ws://localhost:4000/ws');
  url.searchParams.set('token', token);
  return url.toString();
};
