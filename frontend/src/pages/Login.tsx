import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Button, Input, Card, CardBody } from "@/ui/primitives";

export default function Login() {
  const nav = useNavigate();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.target as HTMLFormElement);
    const email = String(form.get("email") || "");
    const password = String(form.get("password") || "");

    try {
      const r = await api.post("/auth/login", { email, password });
      if (r.data?.ok) {
        nav("/search", { replace: true });
      } else {
        setError("login failed");
      }
    } catch {
      setError("login failed");
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md">
      <Card>
        <CardBody>
          <h1 className="mb-4 text-xl font-semibold">Login</h1>
          <form onSubmit={onSubmit} className="grid gap-3">
            <Input name="email" placeholder="email" />
            <Input type="password" name="password" placeholder="password" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit">Login</Button>
            <p className="text-sm text-gray-600">
              No account? <Link to="/register" className="text-indigo-600">Register</Link>
            </p>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
