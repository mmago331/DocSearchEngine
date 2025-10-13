import { useNavigate } from "react-router-dom";
import { Card, CardBody, Button } from "@/ui/primitives";

export default function Register() {
  const nav = useNavigate();
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-4">
          <h1 className="text-xl font-semibold">Registration</h1>
          <p className="text-sm text-gray-600">
            Self-service registration is disabled. Please contact the administrator if you need access.
          </p>
          <Button type="button" className="w-full" onClick={() => nav("/login")}>
            Back to login
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
