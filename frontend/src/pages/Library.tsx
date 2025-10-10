import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function Library() {
  const [docs, setDocs] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setErr(null);
    try { const { data } = await api.get("/documents"); setDocs(data.documents || []); }
    catch (e: any) { setErr(e?.response?.data?.error || "load failed"); }
  };
  useEffect(() => { load(); }, []);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault(); if (!file) return; setLoading(true);
    try { const fd = new FormData(); fd.append("file", file); await api.post("/documents", fd); setFile(null); await load(); }
    catch (e: any) { setErr(e?.response?.data?.error || "upload failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-5xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Library</h1>
      <form onSubmit={upload} className="mb-4 flex items-center gap-2">
        <input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button className="btn" type="submit" disabled={!file || loading}>{loading ? "Uploading…" : "Upload PDF"}</button>
      </form>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      <div className="card"><div className="card-body overflow-x-auto">
        <table className="table">
          <thead><tr>
            <th className="th">Title</th><th className="th">Pages</th><th className="th">Visibility</th><th className="th"></th>
          </tr></thead>
          <tbody>
            {docs.map((d: any) => (
              <tr key={d.id} className="border-t">
                <td className="td">{d.title || d.original_filename || "(untitled)"}</td>
                <td className="td">{d.pages_count || 0}</td>
                <td className="td">{d.is_public ? <span className="badge">Public</span> : <span className="badge">Private</span>}</td>
                <td className="td">
                  <button className="btn-ghost" onClick={async () => { await api.patch(`/documents/${d.id}/visibility`, { is_public: !d.is_public }); await load(); }}>
                    Toggle
                  </button>
                  <button className="btn-ghost" onClick={async () => { if (!confirm("Delete this document?")) return; await api.delete(`/documents/${d.id}`); await load(); }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {docs.length === 0 && <tr><td className="td" colSpan={4}>No documents yet.</td></tr>}
          </tbody>
        </table>
      </div></div>
    </div>
  );
}
