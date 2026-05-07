import { NextResponse } from "next/server";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export function apiUnauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

export function apiForbidden() {
  return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
}

export function apiNotFound(message = "Not found") {
  return NextResponse.json({ success: false, error: message }, { status: 404 });
}

/** Parse and validate request body */
export async function parseBody<T>(request: Request): Promise<{ data: T | null; error: string | null }> {
  try {
    const body = await request.json();
    return { data: body as T, error: null };
  } catch {
    return { data: null, error: "Invalid request body" };
  }
}

/** Extract search params */
export function getSearchParams(url: string): URLSearchParams {
  return new URL(url).searchParams;
}

/** Parse pagination params */
export function getPagination(url: string) {
  const params = getSearchParams(url);
  const page = Math.max(1, parseInt(params.get("page") || "1"));
  const pageSize = Math.min(100, Math.max(1, parseInt(params.get("pageSize") || "20")));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip, take: pageSize };
}
