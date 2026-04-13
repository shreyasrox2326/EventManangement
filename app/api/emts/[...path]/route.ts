import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE_URL = process.env.EMTS_BACKEND_BASE_URL;
const PROXY_SECRET = process.env.VERCEL_RENDER_SECRET;

async function proxyRequest(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  if (!BACKEND_BASE_URL) {
    return NextResponse.json(
      { error: "EMTS_BACKEND_BASE_URL is not configured." },
      { status: 500 }
    );
  }

  if (!PROXY_SECRET) {
    return NextResponse.json(
      { error: "VERCEL_RENDER_SECRET is not configured." },
      { status: 500 }
    );
  }

  const { path } = await context.params;
  const targetUrl = new URL(`${BACKEND_BASE_URL}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      "x-emts-proxy-secret": PROXY_SECRET
    },
    body: ["GET", "HEAD"].includes(request.method) ? undefined : await request.text(),
    cache: "no-store"
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json"
    }
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, context);
}
