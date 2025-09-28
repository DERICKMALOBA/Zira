/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // make sure it scans your React files
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["Inter", "sans-serif"],     // generates font-body
        heading: ["Poppins", "sans-serif"], // generates font-heading
      },
      colors: {
        primary: "#2563eb",
        secondary: "#9333ea",
        danger: "#dc2626",
        background: "#f9fafb",
        text: "#111827",
        warning: "#f59e0b",
      },
    },
  },
  plugins: [],
}
