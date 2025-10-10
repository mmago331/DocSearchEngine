import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const { data } = await api.post("/auth/register", { email, password });
      localStorage.setItem("token", data.token);
      nav("/");
    } catch (e: any) {
      setErr(e?.response?.data?.error || "registration failed");
    }
  };
  return (
    <div className="mx-auto mt-16 max-w-md">
      <div className="card">
        <div className="card-body">
          <h1 className="mb-4 text-xl font-semibold">Create account</h1>
          <form onSubmit={submit} className="grid gap-3">
            <input className="input" placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="input" type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn" type="submit">Sign up</button>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <p className="text-sm text-gray-600">
              Have an account? <Link to="/login" className="text-indigo-600">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
