import { MetadataRoute } from "next";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://zemix.vercel.app");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/projects/", "/explore", "/community", "/builders", "/about"],
        disallow: [
          "/api/",
          "/auth/",
          "/notifications",
          "/profile",
          "/projects/new",
          "/projects/*/edit",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/projects/", "/explore", "/community", "/builders", "/about"],
        disallow: ["/api/", "/auth/"],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/icon.svg", "/icon.png", "/logo.png"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
