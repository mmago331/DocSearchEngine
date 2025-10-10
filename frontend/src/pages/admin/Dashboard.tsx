import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function Dashboard() {
  const [db, setDb] = useState<string>("…");
  useEffect(() => {
    api.get("/health/db").then(r => setDb(r.data?.version || "ok")).catch(() => setDb("error"));
  }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="card"><div className="card-body">
        <div className="text-sm text-gray-600">Database</div>
        <div className="mt-1 text-xl font-semibold">{db}</div>
      </div></div>
      <div className="card"><div className="card-body">
        <div className="text-sm text-gray-600">Status</div>
        <div className="mt-1 text-xl font-semibold">Healthy</div>
      </div></div>
    </div>
  );
}
