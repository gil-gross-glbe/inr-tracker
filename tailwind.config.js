/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0F6E56",
        danger: "#A32D2D",
        dangerBg: "#FCEBEB",
        dangerBorder: "#F7C1C1",
        warning: "#854F0B",
        warningBg: "#FAEEDA",
        success: "#3B6D11",
        successBg: "#EAF3DE",
        grayBg: "#f5f5f0",
        cardBg: "#fff",
        screenBg: "#f7f7f5",
        textMain: "#1a1a1a",
        textMuted: "#888888",
        textSub: "#666666",
        borderLight: "#eeeeee",
        borderDark: "#dddddd",
        pillEmpty: "#f0f0ec",
        pillEmptyBorder: "#B4B2A9",
        pillTaken: "#EAF3DE",
        pillTakenBorder: "#3B6D11",
      }
    },
  },
  plugins: [],
}
