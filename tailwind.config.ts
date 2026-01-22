import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        primary: { DEFAULT: "#6366f1", foreground: "#ffffff" },
        secondary: { DEFAULT: "#f3f4f6", foreground: "#1f2937" },
        destructive: { DEFAULT: "#ef4444", foreground: "#ffffff" },
        accent: { DEFAULT: "#f3f4f6", foreground: "#1f2937" }
      },
      borderRadius: { lg: "0.5rem", md: "0.375rem", sm: "0.25rem" }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;
