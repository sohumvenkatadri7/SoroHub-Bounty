import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neonLime: "#CCFF00",
        bubblegum: "#FF85A1",
        cyanCustom: "#70D6FF",
        sunburst: "#FFD166",
        lilac: "#E0A7FF",
        canvasBg: "#FAF7F2",
      },
      boxShadow: {
        hard: "5px 5px 0px 0px #000",
        hardHover: "6px 6px 0px 0px #000",
        hardActive: "2px 2px 0px 0px #000",
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-6deg)' },
          '50%': { transform: 'translateY(-15px) rotate(-4deg)' },
        },
        floatDelayed: {
          '0%, 100%': { transform: 'translateY(0) rotate(6deg)' },
          '50%': { transform: 'translateY(-15px) rotate(8deg)' },
        }
      },
      animation: {
        marquee: 'marquee 20s linear infinite',
        float: 'float 5s ease-in-out infinite',
        'float-delayed': 'floatDelayed 6s ease-in-out infinite 2s',
      },
    },
  },
  plugins: [],
};

export default config;
