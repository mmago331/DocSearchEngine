import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button, Input, Card, CardBody } from "@/ui/primitives";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    try {
      const r = await api.post("/auth/login", { email, password });
      if (r.status === 200 && (r.data?.ok ?? true)) {
        // minimal client-side signal for auth gating
        localStorage.setItem("token", "session");
        nav("/search", { replace: true });
      } else {
        setErr("Invalid email or password");
      }
    } catch (e: any) {
      setErr(e?.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardBody>
          <h1 className="mb-4 text-xl font-semibold">Login</h1>
          <form onSubmit={submit} className="grid gap-3">
            <Input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
            <Button type="submit">Login</Button>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <p className="text-sm text-gray-600">
              No account? <Link to="/register" className="text-indigo-600">Register</Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
