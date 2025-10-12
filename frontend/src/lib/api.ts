import axios from "axios";

const baseURL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_API_URL as string | undefined)?.trim()) ||
  undefined;

export const api = axios.create({ baseURL });
