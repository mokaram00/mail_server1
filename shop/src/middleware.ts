import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const url = req.nextUrl.clone();

  // Handle redirection from cart and product pages to shop.bltnm.store
  if (host !== "shop.bltnm.store") {
    // Redirect cart page
    if (url.pathname === "/cart" || url.pathname.startsWith("/cart/")) {
      return NextResponse.redirect(`https://shop.bltnm.store${url.pathname}${url.search}`);
    }
    
    // Redirect product detail pages
    if (url.pathname.startsWith("/products/")) {
      return NextResponse.redirect(`https://shop.bltnm.store${url.pathname}${url.search}`);
    }
  }

  // bltnm.store → landing
  if (host === "bltnm.store" || host === "www.bltnm.store") {
    // Allow API routes, static assets, and favicon to pass through
    if (url.pathname.startsWith('/api') || 
        url.pathname.startsWith('/_next') || 
        url.pathname.includes('.') ||
        url.pathname === '/favicon.ico') {
      return NextResponse.next();
    }
    
    // For all other paths on bltnm.store, show the landing page
    url.pathname = "/landing";
    return NextResponse.rewrite(url);
  }

  // shop.bltnm.store → shop
  if (host === "shop.bltnm.store") {
    // Allow API routes and static assets to pass through
    if (url.pathname.startsWith('/api') || 
        url.pathname.startsWith('/_next') || 
        url.pathname.includes('.') ||
        url.pathname === '/favicon.ico') {
      return NextResponse.next();
    }
    
    // Ensure the path starts with /shop if it doesn't already
    if (!url.pathname.startsWith("/shop")) {
      url.pathname = `/shop${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // dashboard.bltnm.store → dashboard
  if (host === "dashboard.bltnm.store") {
    // Allow API routes and static assets to pass through
    if (url.pathname.startsWith('/api') || 
        url.pathname.startsWith('/_next') || 
        url.pathname.includes('.') ||
        url.pathname === '/favicon.ico') {
      return NextResponse.next();
    }
    
    // Ensure the path starts with /dashboard if it doesn't already
    if (!url.pathname.startsWith("/dashboard")) {
      url.pathname = `/dashboard${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};