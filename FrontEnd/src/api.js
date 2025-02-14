import axios from 'axios';

export const baseURL =
  import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT === 'DEV'
    ? import.meta.env.VITE_API_URL_DEV
    : import.meta.env.VITE_API_URL;

const api = axios.create({ baseURL });

export default api;
