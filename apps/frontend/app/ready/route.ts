import { backendRequest } from "../../lib/backend";

export async function GET() {
  const ready = await backendRequest("/ready").then(
    (response) => response.ok,
    () => false,
  );
  return Response.json(
    { status: ready ? "ready" : "unavailable" },
    { status: ready ? 200 : 503 },
  );
}
