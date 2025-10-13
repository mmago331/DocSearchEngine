import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card, CardBody, Table, Th, Td, Button, Badge } from "@/ui/primitives";
import { useToast } from "@/ui/toast";

export default function AdminDocuments() {
  const [docs, setDocs] = useState<any[]>([]);
  const { push } = useToast();

  const load = async () => {
    try {
      const { data } = await api.get<{ documents?: any[] }>("/documents");
      setDocs(data?.documents || []);
    } catch (error: any) {
      const message = error?.response?.data?.error || "Load failed";
      push({ text: message, tone: "error" });
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold">Documents</h1>
      <Card>
        <CardBody className="overflow-x-auto">
          <Table>
            <thead><tr><Th>Title</Th><Th>Owner</Th><Th>Pages</Th><Th>Visibility</Th><Th /></tr></thead>
            <tbody>
              {docs.map((d: any) => (
                <tr key={d.id} className="border-t">
                  <Td>{d.title || d.original_filename || "(untitled)"}</Td>
                  <Td className="text-gray-600">(you)</Td>
                  <Td>{d.pages_count || 0}</Td>
                  <Td>{d.is_public ? <Badge>Public</Badge> : <Badge>Private</Badge>}</Td>
                  <Td>
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        try {
                          await api.delete(`/documents/${d.id}`);
                        } catch (error: any) {
                          const message = error?.response?.data?.error || "Delete failed";
                          push({ text: message, tone: "error" });
                          return;
                        }
                        await load();
                        push({ text: "Deleted", tone: "success" });
                      }}
                    >
                      Delete
                    </Button>
                  </Td>
                </tr>
              ))}
              {docs.length === 0 && <tr><Td colSpan={5}>No documents found.</Td></tr>}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
