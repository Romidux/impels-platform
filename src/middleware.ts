import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter — only active when Upstash env vars are set
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(10, "60 s"),
        analytics: false,
      })
    : null;

const RATE_LIMITED_PATHS = ["/login", "/register", "/api/export"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for sensitive routes
  if (ratelimit && RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "anonymous";
    const { success } = await ratelimit.limit(`rl:${ip}`);
    if (!success) {
      return new NextResponse("Too many requests", { status: 429 });
    }
  }

  // Skip auth for public routes — no need to call getUser() on storefront
  if (
    pathname.startsWith("/store/") ||
    pathname === "/" ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  // Protect admin routes — real super admin check
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    // Check super admin via user_metadata (set in Supabase Auth)
    // or against a comma-separated env var SUPER_ADMIN_EMAILS
    const superAdminEmails = (process.env.SUPER_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    const isSuperAdmin =
      user.user_metadata?.is_super_admin === true ||
      (superAdminEmails.length > 0 &&
        superAdminEmails.includes((user.email || "").toLowerCase()));
    if (!isSuperAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from auth pages — but ONLY for page
  // navigations (GET), never for Server Action requests (POST with
  // "next-action" header). Without this check, signUp() sets session
  // cookies and the subsequent server action call to createStoreForUser()
  // gets redirected before it can execute — causing the store to never
  // be created during registration.
  const isServerAction = request.headers.has("next-action");
  if (
    user &&
    !isServerAction &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
