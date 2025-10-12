import { useState } from "react";
import { api } from "@/lib/api";
import { Button, Input, Card, CardBody, Badge } from "@/ui/primitives";

type Row = {
  pageid: string;
  documentid: string;
  documenttitle: string | null;
  pagenumber: number;
  rank: number;
  snippet: string | null;
};

export default function Home() {
  const [q, setQ] = useState(""); const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null); const [loading, setLoading] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(null); setLoading(true);
    try { const { data } = await api.get("/api/search", { params: { q } }); setRows(data.results || []); }
    catch (e: any) { setErr(e?.response?.data?.error || "search failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-semibold">Search</h1>
      <form onSubmit={search} className="mb-4 flex gap-2">
        <Input placeholder="Search terms…" value={q} onChange={e => setQ(e.target.value)} />
        <Button type="submit" disabled={!q || loading}>{loading ? "Searching…" : "Search"}</Button>
      </form>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      <Card>
        <CardBody>
          {rows.length === 0 ? <p className="text-sm text-gray-600">No results yet.</p> : (
            <ul className="grid gap-3">
              {rows.map(r => (
                <li key={`${r.documentid}-${r.pagenumber}`} className="rounded-lg border border-gray-200 p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                    <span>{r.documenttitle || "(untitled)"}</span>
                    <Badge>page {r.pagenumber}</Badge>
                  </div>
                  {r.snippet && <div className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: r.snippet }} />}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
