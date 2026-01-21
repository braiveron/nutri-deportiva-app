/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta Deportiva Agresiva
        sportRed: "#D90429", // Rojo vibrante
        sportDark: "#111111", // Negro casi puro
        sportGray: "#8D99AE", // Gris metálico
        sportSilver: "#EDF2F4", // Blanco grisáceo
      },
      fontFamily: {
        sans: ["Barlow", "sans-serif"],
        display: ["Oswald", "sans-serif"], // Fuente para títulos
      },
      boxShadow: {
        sport: "4px 4px 0px 0px rgba(0,0,0,1)", // Sombra dura, sin difuminar (estilo cómic/sport)
      },
    },
  },
  plugins: [],
};
