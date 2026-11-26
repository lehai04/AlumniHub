/** @type {import("next").NextConfig} */
export default {
  poweredByHeader: false,
  distDir: process.env.ALUMNI_ADMIN_DEV === "true" ? ".next-admin" : ".next",
  async redirects() {
    return process.env.ALUMNI_ADMIN_DEV === "true"
      ? [{ source: "/", destination: "/admin", permanent: false }]
      : [];
  },
};
