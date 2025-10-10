import { useEffect, useState } from "react";
import api from "@/lib/api";

export default function AdminDocuments() {
  const [docs, setDocs] = useState<any[]>([]);
  const load = async () => {
    const { data } = await api.get("/documents"); // replace with admin endpoint later
    setDocs(data.documents || []);
  };
  useEffect(() => { load(); }, []);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Documents</h1>
      <div className="card">
        <div className="card-body overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Title</th>
                <th className="th">Owner</th>
                <th className="th">Pages</th>
                <th className="th">Visibility</th>
                <th className="th"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d) => (
                <tr key={d.id} className="border-t">
                  <td className="td">{d.title || d.original_filename || "(untitled)"}</td>
                  <td className="td text-gray-600">(you)</td>
                  <td className="td">{d.pages_count || 0}</td>
                  <td className="td">{d.is_public ? "Public" : "Private"}</td>
                  <td className="td">
                    <button className="btn-ghost" onClick={async () => { await api.delete(`/documents/${d.id}`); await load(); }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && <tr><td className="td" colSpan={5}>No documents found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
