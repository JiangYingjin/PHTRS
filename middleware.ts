import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CookieName = "JYJ.SSO";
const CookieValue = "auth";
const CookieDomain = ".JYJ.cx";
const CookieMaxAge = 60 * 60 * 24 * 30;

export function middleware(request: NextRequest) {
  const _cookies = request.cookies;
  // console.log("中间件获取 Cookies：", _cookies);
  if (
    !_cookies.get(CookieName) ||
    (_cookies.get(CookieName)?.value !== CookieValue)
  ) {
    // console.log("未鉴权，禁止访问");
    return NextResponse.redirect(new URL("/", request.url));
  } else {
    // console.log("鉴权通过，允许访问");
    const response = NextResponse.next();
    // console.log("设置永久 Cookie ...");
    response.cookies.set({
      name: CookieName,
      value: CookieValue,
      domain: CookieDomain,
      maxAge: CookieMaxAge,
    });
    return response;
  }
}

export const config = {
  matcher: [
    "/Done",
    "/Done/(.*)",
    "/clipboard",
    "/Aliyun/SecurityGroup",
    "/nextchat",
    "/Liqin",
  ],
};
