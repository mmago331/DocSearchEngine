import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardBody } from "@/ui/primitives";

export default function Dashboard() {
  const [db, setDb] = useState<string>("…");
  useEffect(() => {
    api
      .get<{ ok?: boolean }>("/api/health")
      .then(({ data }) => {
        setDb(data?.ok ? "ok" : "error");
      })
      .catch(() => setDb("error"));
  }, []);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardBody>
          <div className="text-sm text-gray-600">Database</div>
          <div className="mt-1 text-xl font-semibold">{db}</div>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <div className="text-sm text-gray-600">Status</div>
          <div className="mt-1 text-xl font-semibold">Healthy</div>
        </CardBody>
      </Card>
    </div>
  );
}
