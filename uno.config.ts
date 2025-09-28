import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  theme: {
    colors: {
      bg: "#fdfcfa",
      ink: "#101112",
      panel: "#ffffff",
      accent: "#ff4555",
      accentAlt: "#ffbf3c",
    },
    boxShadow: {
      brutal: "4px 4px 0 #101112",
      brutalSm: "2px 2px 0 #101112",
    },
    borderRadius: {
      brutal: "6px",
    },
  },
  shortcuts: {
    surface: "bg-panel border-2 border-ink rounded-brutal shadow-brutal",
    "bubble-surface":
      "bg-accentAlt border-2 border-ink rounded-brutal shadow-brutalSm relative",
    "btn-brutal":
      "surface bg-accent text-white font-semibold px-3 py-2 leading-none transition-transform duration-150 hover:brightness-105 active:(translate-x-0.5 translate-y-0.5 shadow-none)",
    "chip-brutal":
      "surface bg-panel text-ink border-2 border-ink rounded-full shadow-brutalSm transition-transform duration-150 hover:brightness-105 active:(translate-x-0.5 translate-y-0.5 shadow-none)",
    "fab-brutal":
      "surface bg-accent text-white rounded-full h-14 w-14 shadow-brutal flex items-center justify-center text-3xl border-2 border-ink transition-transform duration-150 hover:brightness-105 active:(translate-x-0.5 translate-y-0.5 shadow-none)",
    "floating-surface": "surface bg-panel/95 backdrop-blur-sm",
    "textarea-brutal":
      "surface w-full min-h-[4.5rem] resize-none px-3 py-3 text-sm leading-relaxed focus:(outline-none ring-2 ring-accent)",
    "scroll-y": "flex-1 overflow-y-auto flex flex-col gap-3 pr-1",
  },
  safelist: [
    "surface",
    "bubble-surface",
    "btn-brutal",
    "chip-brutal",
    "fab-brutal",
    "floating-surface",
    "textarea-brutal",
  ],
  presets: [presetUno()],
});
