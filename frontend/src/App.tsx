import { useEffect, useState } from "react";

export default function App() {
  const [ok, setOk] = useState<string>("loading…");
  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setOk(JSON.stringify(d)))
      .catch((e) => setOk("error: " + e));
  }, []);
  return (
    <div className="p-6">
      <h1>DocSearchEngine</h1>
      <p>API check: {ok}</p>
      {/* TODO: import your Catalyst components and real pages here */}
    </div>
  );
}
