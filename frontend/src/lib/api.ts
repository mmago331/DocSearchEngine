import axios from "axios";

// Same-origin client; cookies included for session auth.
export const api = axios.create({
  baseURL: "/",
  withCredentials: true,
});
