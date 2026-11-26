import { backendRequest } from "../../../lib/backend";

type Context = { params: Promise<{ path: string[] }> };
// Giữ cùng origin với giao diện và chuyển phiên đăng nhập đến backend để kiểm tra quyền.
async function forward(request: Request, { params }: Context) {
  const { path } = await params;
  if (
    path.length > 4 ||
    !path.every((segment) => /^[a-z0-9-]{1,80}$/.test(segment))
  )
    return Response.json({ error: "not_found" }, { status: 404 });
  if (
    request.method !== "GET" &&
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return Response.json({ error: "forbidden" }, { status: 403 });
  const headers = new Headers();
  for (const name of ["cookie", "content-type", "x-cv-name"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const init: RequestInit & { duplex?: "half" } = {
    method: request.method,
    headers,
  };
  if (request.body) {
    init.body = request.body;
    init.duplex = "half";
  }
  try {
    const result = await backendRequest(
      `/api/${path.join("/")}${new URL(request.url).search}`,
      init,
    );
    const headers = new Headers({
      "content-type":
        result.headers.get("content-type") ?? "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    });
    const cookie = result.headers.get("set-cookie");
    if (cookie) headers.set("set-cookie", cookie);
    const attachment = result.headers.get("content-disposition");
    if (attachment) headers.set("content-disposition", attachment);
    const policy = result.headers.get("content-security-policy");
    if (policy) headers.set("content-security-policy", policy);
    return new Response(result.body, { status: result.status, headers });
  } catch {
    return Response.json({ error: "backend_unavailable" }, { status: 503 });
  }
}

export {
  forward as GET,
  forward as POST,
  forward as PATCH,
  forward as PUT,
  forward as DELETE,
};
