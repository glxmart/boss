import type { Config } from "tailwindcss";
import { tailwindConfig as baseConfig } from "@repo/config/tailwind";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../apps/web/app/**/*.{ts,tsx}",
    "../../apps/admin/app/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  presets: [baseConfig as Config],
  plugins: [require("tailwindcss-animate")],
};

export default config;
