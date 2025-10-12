import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button, Input, Card, CardBody, Table, Th, Td, Badge } from "@/ui/primitives";
import { useToast } from "@/ui/toast";

export default function Library() {
  const [docs, setDocs] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const load = async () => {
    setErr(null);
    try {
      const res = await api("/api/documents");
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "load failed");
      setDocs(data.documents || []);
    } catch (error: any) {
      setErr(error?.message || "load failed");
    }
  };
  useEffect(() => { load(); }, []);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/documents", {
        method: "POST",
        body: fd,
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.error || "upload failed");
      }
      setFile(null);
      await load();
      push({ text: "Uploaded", tone: "success" });
    } catch (error: any) {
      setErr(error?.message || "upload failed");
      push({ text: "Upload failed", tone: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-4 text-2xl font-semibold">Library</h1>
      <form onSubmit={upload} className="mb-4 flex items-center gap-2">
        <Input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] || null)} />
        <Button type="submit" disabled={!file || loading}>{loading ? "Uploading…" : "Upload PDF"}</Button>
      </form>
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      <Card>
        <CardBody className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Title</Th><Th>Pages</Th><Th>Visibility</Th><Th /></tr></thead>
            <tbody>
              {docs.map((d: any) => (
                <tr key={d.id} className="border-t">
                  <Td>{d.title || d.original_filename || "(untitled)"}</Td>
                  <Td>{d.pages_count || 0}</Td>
                  <Td>{d.is_public ? <Badge>Public</Badge> : <Badge>Private</Badge>}</Td>
                  <Td>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          const res = await api(`/api/documents/${d.id}/visibility`, {
                            method: "PATCH",
                            body: JSON.stringify({ is_public: !d.is_public }),
                          });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            push({ text: data?.error || "Update failed", tone: "error" });
                            return;
                          }
                          await load();
                          push({ text: "Visibility updated", tone: "success" });
                        }}
                      >
                        Toggle
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          if (!confirm("Delete this document?")) return;
                          const res = await api(`/api/documents/${d.id}`, { method: "DELETE" });
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok) {
                            push({ text: data?.error || "Delete failed", tone: "error" });
                            return;
                          }
                          await load();
                          push({ text: "Deleted", tone: "success" });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
              {docs.length === 0 && <tr><Td colSpan={4}>No documents yet.</Td></tr>}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
