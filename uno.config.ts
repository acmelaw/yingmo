import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      // Neo-brutalism color palette
      brutal: {
        black: "#000000",
        white: "#FFFFFF",
        bg: "#FDFCFA",
        "bg-dark": "#1A1A1A",
        primary: "#FF6B6B",
        secondary: "#4ECDC4",
        accent: "#FFE66D",
        success: "#95E1D3",
        warning: "#F38181",
        border: "#000000",
        "border-light": "#E5E5E5",
        text: "#101112",
        "text-light": "#6B7280",
        "text-dark": "#E5E5E5",
      },
    },
    boxShadow: {
      brutal: "4px 4px 0px 0px #000000",
      "brutal-sm": "2px 2px 0px 0px #000000",
      "brutal-lg": "6px 6px 0px 0px #000000",
      "brutal-hover": "6px 6px 0px 0px #000000",
    },
  },
  shortcuts: {
    // Base brutal components
    "brutal-border": "border-3 border-brutal-black",
    "brutal-shadow": "shadow-brutal",
    "brutal-shadow-sm": "shadow-brutal-sm",
    "brutal-shadow-lg": "shadow-brutal-lg",

    // Brutal surfaces
    "brutal-surface":
      "bg-brutal-white brutal-border brutal-shadow rounded-none",
    "brutal-surface-primary":
      "bg-brutal-primary brutal-border brutal-shadow rounded-none",
    "brutal-surface-secondary":
      "bg-brutal-secondary brutal-border brutal-shadow rounded-none",
    "brutal-surface-accent":
      "bg-brutal-accent brutal-border brutal-shadow rounded-none",

    // Brutal buttons
    "brutal-btn":
      "brutal-surface px-4 py-2 font-bold uppercase tracking-wide cursor-pointer transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:shadow-brutal-hover",
    "brutal-btn-sm":
      "brutal-surface px-3 py-1.5 text-sm font-bold uppercase tracking-wide cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",
    "brutal-btn-primary":
      "brutal-surface-primary text-brutal-white px-4 py-2 font-bold uppercase tracking-wide cursor-pointer transition-all active:translate-x-1 active:translate-y-1 active:shadow-none hover:shadow-brutal-hover",
    "brutal-btn-icon":
      "brutal-surface w-10 h-10 flex items-center justify-center font-bold cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none",

    // Chat bubble styles
    "chat-bubble-sent":
      "bg-brutal-primary text-brutal-white brutal-border brutal-shadow-sm rounded-2xl rounded-br-none ml-auto",
    "chat-bubble-received":
      "bg-brutal-white brutal-border brutal-shadow-sm rounded-2xl rounded-bl-none",

    // Input styles
    "brutal-input":
      "brutal-border bg-brutal-white px-4 py-3 font-medium focus:outline-none focus:shadow-brutal-lg transition-shadow",

    // Containers
    "brutal-container": "max-w-4xl mx-auto px-4",
  },
});
