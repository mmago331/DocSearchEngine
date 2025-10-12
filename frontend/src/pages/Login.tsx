import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { Button, Input, Card, CardBody } from "@/ui/primitives";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token); nav("/");
    } catch (e: any) { setErr(e?.response?.data?.error || "login failed"); }
  };

  return (
    <div className="mx-auto mt-16 max-w-md">
      <Card>
        <CardBody>
          <h1 className="mb-4 text-xl font-semibold">Login</h1>
          <form onSubmit={submit} className="grid gap-3">
            <Input placeholder="email" value={email} onChange={e => setEmail(e.target.value)} />
            <Input type="password" placeholder="password" value={password} onChange={e => setPassword(e.target.value)} />
            <Button type="submit">Login</Button>
            {err && <p className="text-sm text-red-600">{err}</p>}
            <p className="text-sm text-gray-600">No account? <Link to="/register" className="text-indigo-600">Register</Link></p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
