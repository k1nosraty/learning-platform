import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["pg", "nodemailer"],
  devIndicators: false,
};
export default config;
