import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      // Base colors - pure black/white foundation
      base: {
        black: "#000000",
        white: "#FFFFFF",
      },
      
      // Backgrounds
      bg: {
        primary: "#FAFAFA",
        secondary: "#F0F0F0",
        tertiary: "#E8E8E8",
      },
      
      // Text colors
      text: {
        primary: "#000000",
        secondary: "#333333",
        tertiary: "#666666",
      },
      
      // Accent colors - vibrant and loud
      accent: {
        pink: "#FF006E",
        cyan: "#00F5FF",
        yellow: "#FFFF00",
        green: "#00FF41",
        purple: "#B026FF",
        orange: "#FF6B00",
      },
      
      // Semantic colors
      semantic: {
        success: "#00FF41",
        error: "#FF006E",
        warning: "#FFFF00",
        info: "#00F5FF",
      },
      
      // Dark mode colors
      "dark-bg-primary": "#0A0A0A",
      "dark-bg-secondary": "#1A1A1A",
      "dark-bg-tertiary": "#2A2A2A",
      "dark-text-primary": "#FFFFFF",
      "dark-text-secondary": "#CCCCCC",
      "dark-text-tertiary": "#999999",
    },
    
    boxShadow: {
      // Hard shadows - no blur!
      "hard-sm": "3px 3px 0 #000",
      "hard": "5px 5px 0 #000",
      "hard-lg": "8px 8px 0 #000",
      "hard-xl": "12px 12px 0 #000",
      
      // Hover states
      "hard-hover": "7px 7px 0 #000",
      "hard-active": "2px 2px 0 #000",
      
      // Dark mode variants
      "dark-hard-sm": "3px 3px 0 #fff",
      "dark-hard": "5px 5px 0 #fff",
      "dark-hard-lg": "8px 8px 0 #fff",
      "dark-hard-xl": "12px 12px 0 #fff",
      "dark-hard-hover": "7px 7px 0 #fff",
      "dark-hard-active": "2px 2px 0 #fff",
    },
  },
  
  
  shortcuts: {
    // === BUTTON COMPONENTS ===
    
    // Base button - white background, black border, hard shadow
    "btn-base":
      "inline-flex items-center justify-center gap-2 px-6 py-3 font-black uppercase tracking-wide bg-base-white text-base-black border-3 border-base-black rounded-none shadow-hard cursor-pointer transition-all duration-100 hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard-hover) active:(translate-x-0.5 translate-y-0.5 shadow-hard-active) disabled:(opacity-50 cursor-not-allowed transform-none!)",
    
    // Primary button - pink background
    "btn-primary":
      "btn-base bg-accent-pink text-base-white hover:bg-accent-purple",
    
    // Secondary button - cyan background
    "btn-secondary":
      "btn-base bg-accent-cyan text-base-black hover:bg-accent-yellow",
    
    // Success button - green background  
    "btn-success":
      "btn-base bg-accent-green text-base-black",
    
    // Ghost button - transparent background
    "btn-ghost":
      "btn-base bg-transparent shadow-none",
    
    // Icon button - square format
    "btn-icon":
      "w-11 h-11 flex items-center justify-center font-black border-3 border-base-black rounded-sm shadow-hard-sm bg-base-white text-base-black cursor-pointer transition-all duration-100 hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard) active:(translate-x-0.5 translate-y-0.5 shadow-none)",
    
    // Button sizes
    "btn-sm":
      "px-3 py-2 text-sm",
    "btn-lg":
      "px-8 py-4 text-lg",
    
    // === CARD COMPONENTS ===
    
    // Message bubble - base card style
    "card-message":
      "p-6 bg-base-white border-3 border-base-black rounded-sm shadow-hard transition-all duration-100 hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard-lg)",
    
    // === INPUT COMPONENTS ===
    
    // Base input
    "input-base":
      "w-full px-4 py-3 font-bold bg-bg-primary border-2 border-base-black rounded-sm outline-none transition-all duration-100 focus:(bg-base-white shadow-hard-sm border-accent-cyan)",
    
    // === SURFACE/CONTAINER COMPONENTS ===
    
    // Page container
    "container-page":
      "max-w-4xl mx-auto px-4",
    
    // Surface with border and shadow
    "surface-elevated":
      "bg-base-white border-3 border-base-black shadow-hard",
    
    // === DARK MODE SHORTCUTS ===
    
    // Dark mode button
    "dark:btn-base":
      "dark:(bg-dark-bg-primary text-dark-text-primary border-white shadow-dark-hard hover:shadow-dark-hard-hover active:shadow-dark-hard-active)",
    
    "dark:btn-icon":
      "dark:(bg-dark-bg-primary text-dark-text-primary border-white shadow-dark-hard-sm hover:shadow-dark-hard)",
    
    // Dark mode card
    "dark:card-message":
      "dark:(bg-dark-bg-primary border-white shadow-dark-hard hover:shadow-dark-hard-lg)",
    
    // Dark mode input
    "dark:input-base":
      "dark:(bg-dark-bg-secondary text-dark-text-primary border-white focus:border-accent-cyan)",
    
    // Dark mode surface
    "dark:surface-elevated":
      "dark:(bg-dark-bg-primary border-white shadow-dark-hard)",
  },
  
  safelist: [
    // Ensure key utilities are always available
    "shadow-hard",
    "shadow-hard-sm",
    "shadow-hard-lg",
    "shadow-hard-hover",
    "border-3",
    "border-4",
    "font-black",
    "rounded-none",
    "rounded-sm",
  ],
});
