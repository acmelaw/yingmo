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

      // Brutal color shortcuts
      brutal: {
        black: "#000000",
        white: "#FFFFFF",
        green: "#25D366", // WhatsApp green
        pink: "#FF006E",
        cyan: "#00F5FF",
        yellow: "#FFFF00",
        purple: "#B026FF",
        orange: "#FF6B00",
        "text": "#000000",
        "text-secondary": "#666666",
        "border-color": "#000000",
      },

      // Backgrounds - WhatsApp inspired
      bg: {
        primary: "#ECE5DD", // WhatsApp chat background
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
        green: "#25D366", // WhatsApp green
        purple: "#B026FF",
        orange: "#FF6B00",
      },

      // Semantic colors
      semantic: {
        success: "#25D366",
        error: "#FF006E",
        warning: "#FFFF00",
        info: "#00F5FF",
      },

      // Dark mode colors
      "dark-bg-primary": "#0B141A", // WhatsApp dark mode
      "dark-bg-secondary": "#1A1A1A",
      "dark-bg-tertiary": "#2A2A2A",
      "dark-text-primary": "#FFFFFF",
      "dark-text-secondary": "#CCCCCC",
      "dark-text-tertiary": "#999999",
    },

    boxShadow: {
      // Hard shadows - no blur!
      "hard-sm": "2px 2px 0 #000",
      hard: "4px 4px 0 #000",
      "hard-lg": "6px 6px 0 #000",
      "hard-xl": "8px 8px 0 #000",

      // Hover states
      "hard-hover": "5px 5px 0 #000",
      "hard-active": "1px 1px 0 #000",

      // Dark mode variants
      "dark-hard-sm": "2px 2px 0 #fff",
      "dark-hard": "4px 4px 0 #fff",
      "dark-hard-lg": "6px 6px 0 #fff",
      "dark-hard-xl": "8px 8px 0 #fff",
      "dark-hard-hover": "5px 5px 0 #fff",
      "dark-hard-active": "1px 1px 0 #fff",
    },

    breakpoints: {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    },

    animation: {
      keyframes: {
        'brutal-pop': '{from{opacity:0;transform:scale(0.9)}to{opacity:1;transform:scale(1)}}',
        'slide-up': '{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}',
        'slide-down': '{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}',
      },
    },
  },

  shortcuts: {
    // === MESSENGER LAYOUT (WhatsApp Style) ===

    // Main chat container - full screen chat experience
    "chat-container":
      "flex flex-col h-screen w-full bg-bg-primary dark:bg-dark-bg-primary overflow-hidden",

    // Chat header (WhatsApp top bar with contact/group name)
    "chat-header":
      "flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-accent-green dark:bg-dark-bg-secondary border-b-3 sm:border-b-4 border-base-black dark:border-white shadow-hard shrink-0 z-50",

    // Messages area (scrollable chat history)
    "chat-messages":
      "flex-1 overflow-y-auto overflow-x-hidden px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 space-y-2 sm:space-y-3",

    // Composer bar (WhatsApp message input + send button)
    "chat-composer":
      "shrink-0 p-2 sm:p-3 bg-bg-secondary dark:bg-dark-bg-secondary border-t-3 sm:border-t-4 border-base-black dark:border-white shadow-hard",

    // === MESSAGE BUBBLES (WhatsApp Style) ===

    // Outgoing message (user's messages - right aligned, green)
    "msg-out":
      "ml-auto max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] p-2.5 sm:p-3 md:p-4 bg-accent-green text-base-black border-2 sm:border-3 border-base-black rounded-lg sm:rounded-xl shadow-hard sm:shadow-hard-lg font-bold break-words",

    // Incoming message (system/received - left aligned, white)
    "msg-in":
      "mr-auto max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] p-2.5 sm:p-3 md:p-4 bg-base-white dark:bg-dark-bg-tertiary text-base-black dark:text-dark-text-primary border-2 sm:border-3 border-base-black dark:border-white rounded-lg sm:rounded-xl shadow-hard sm:shadow-hard-lg font-bold break-words",

    // === BUTTON COMPONENTS (Touch-optimized) ===

    // Base button - mobile-first touch target (min 44x44px)
    "btn-base":
      "inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 min-h-[44px] font-black text-sm sm:text-base uppercase tracking-wide bg-base-white text-base-black border-2 sm:border-3 border-base-black rounded-md shadow-hard cursor-pointer transition-all duration-100 hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard-hover) active:(translate-x-0.5 translate-y-0.5 shadow-hard-active) disabled:(opacity-50 cursor-not-allowed transform-none!) touch-manipulation select-none",

    // Primary button - WhatsApp green
    "btn-primary":
      "btn-base bg-accent-green text-base-black hover:bg-accent-cyan active:bg-accent-green dark:(bg-accent-green text-base-black border-white shadow-dark-hard hover:shadow-dark-hard-hover)",

    // Secondary button - cyan accent
    "btn-secondary":
      "btn-base bg-accent-cyan text-base-black hover:bg-accent-yellow active:bg-accent-cyan dark:(bg-accent-cyan text-base-black border-white shadow-dark-hard hover:shadow-dark-hard-hover)",

    // Danger button - pink/red
    "btn-danger":
      "btn-base bg-accent-pink text-base-white hover:bg-semantic-error active:bg-accent-pink dark:(bg-accent-pink border-white shadow-dark-hard hover:shadow-dark-hard-hover)",

    // Icon button - compact, touch-friendly
    "btn-icon":
      "w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] flex items-center justify-center font-black text-lg sm:text-xl border-2 sm:border-3 border-base-black rounded-md sm:rounded-lg shadow-hard-sm bg-base-white text-base-black cursor-pointer transition-all duration-100 hover:(-translate-x-0.5 -translate-y-0.5 shadow-hard) active:(translate-x-0.5 translate-y-0.5 shadow-none) touch-manipulation select-none dark:(bg-dark-bg-primary text-dark-text-primary border-white shadow-dark-hard-sm hover:shadow-dark-hard)",

    // Send button (special styling for composer - prominent)
    "btn-send":
      "px-4 sm:px-5 md:px-6 py-2.5 sm:py-3 min-h-[44px] font-black text-base sm:text-lg bg-accent-green text-base-black border-2 sm:border-3 border-base-black rounded-lg sm:rounded-xl shadow-hard cursor-pointer transition-all duration-100 hover:(-translate-x-1 -translate-y-1 shadow-hard-lg bg-accent-cyan) active:(translate-x-0.5 translate-y-0.5 shadow-hard-active) disabled:(opacity-40 cursor-not-allowed transform-none!) touch-manipulation select-none dark:(border-white shadow-dark-hard hover:shadow-dark-hard-lg)",

    // === TAGS & BADGES (Chat metadata) ===

    // Hashtag badge
    "tag-badge":
      "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-2xs sm:text-xs font-black uppercase bg-accent-pink text-base-white border-1.5 sm:border-2 border-base-black rounded shadow-hard-sm dark:(border-white shadow-dark-hard-sm)",

    // Category badge
    "category-badge":
      "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-2xs sm:text-xs font-black uppercase bg-accent-cyan text-base-black border-1.5 sm:border-2 border-base-black rounded shadow-hard-sm dark:(border-white shadow-dark-hard-sm)",

    // Type badge
    "type-badge":
      "inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 text-2xs sm:text-xs font-black uppercase bg-accent-yellow text-base-black border-1.5 sm:border-2 border-base-black rounded shadow-hard-sm dark:(border-white shadow-dark-hard-sm)",

    // === INPUT COMPONENTS ===

    // Base input (for composer)
    "input-base":
      "w-full px-3 sm:px-4 py-2 sm:py-3 font-bold text-base bg-base-white border-3 border-base-black rounded-lg outline-none transition-all duration-100 focus:(shadow-hard-sm border-accent-cyan) dark:(bg-dark-bg-tertiary text-dark-text-primary border-white focus:border-accent-cyan) touch-manipulation",

    // Search input
    "input-search":
      "w-full px-4 py-3 font-bold text-sm sm:text-base bg-base-white border-3 border-base-black rounded-lg outline-none transition-all duration-100 focus:(shadow-hard border-accent-green) dark:(bg-dark-bg-tertiary text-dark-text-primary border-white)",

    // === MENU/DROPDOWN ===

    // Dropdown menu
    "menu-dropdown":
      "absolute bottom-full mb-2 p-2 bg-base-white border-3 border-base-black shadow-hard-lg z-50 rounded-sm min-w-48 max-h-64 overflow-y-auto dark:(bg-dark-bg-primary border-white shadow-dark-hard-lg)",

    // Menu item
    "menu-item":
      "w-full px-3 py-2 text-left font-bold border-2 border-base-black rounded-sm mb-1 last:mb-0 hover:(bg-accent-yellow translate-x-1) active:(translate-x-0) transition-all duration-100 cursor-pointer touch-manipulation dark:(border-white hover:bg-accent-yellow hover:text-base-black)",

    // === ANIMATIONS ===

    // Slide up animation for messages
    "animate-slide-up": "animate-[slide-up_0.2s_ease-out]",

    // === UTILITIES ===

    // Text styles
    "text-brutal": "font-black uppercase tracking-wide",
    "text-soft": "font-bold",

    // Responsive padding
    "p-responsive": "p-3 sm:p-4 md:p-6",
    "px-responsive": "px-3 sm:px-4 md:px-6",
    "py-responsive": "py-2 sm:py-3 md:py-4",
  },

  safelist: [
    // Ensure key utilities are always available
    "shadow-hard",
    "shadow-hard-sm",
    "shadow-hard-lg",
    "shadow-hard-hover",
    "shadow-hard-active",
    "border-2",
    "border-3",
    "border-4",
    "font-black",
    "font-bold",
    "rounded-none",
    "rounded-sm",
    "rounded-lg",
  ],
});
