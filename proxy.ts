import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const callbackCookie =
  /((?:__Secure-|__Host-)?authjs\.callback-url)=([^;]*)/g;

function decodeCallbackValue(value: string): string {
  let current = value;
  for (let i = 0; i < 2; i += 1) {
    if (!current.includes("%")) break;
    try {
      const next = decodeURIComponent(current);
      if (next === current) break;
      current = next;
    } catch {
      break;
    }
  }
  return current;
}

export function proxy(request: NextRequest) {
  const cookie = request.headers.get("cookie");
  if (!cookie?.includes("authjs.callback-url")) return NextResponse.next();

  const replacements: { name: string; value: string }[] = [];
  const header = cookie.replace(callbackCookie, (_match, name: string, value: string) => {
    const decoded = decodeCallbackValue(value);
    if (decoded !== value) replacements.push({ name, value: decoded });
    return `${name}=${decoded}`;
  });

  if (replacements.length === 0) return NextResponse.next();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("cookie", header);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  for (const item of replacements) {
    response.cookies.set(item.name, item.value, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: item.name.startsWith("__Secure-") || item.name.startsWith("__Host-"),
    });
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      has: [{ type: "cookie", key: "authjs.callback-url" }],
    },
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      has: [{ type: "cookie", key: "__Secure-authjs.callback-url" }],
    },
  ],
};
