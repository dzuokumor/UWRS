module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#e63946",
        secondary: "#1a1a1a",
        neutral: "#6b7280",
        dark: {
          900: "#121212",
          800: "#1e1e1e"
        },
        light: {
          100: "#f8f9fa",
          200: "#e9ecef"
        },
        uwrs: {
          red: "#E63946",
          dark: "#1D3557",
          light: "#F1FAEE",
          accent: "#A8DADC",
          secondary: "#457B9D"
        }
      },
      animation: {
        "fade-in": "fadeIn 1s ease-in-out",
        "slide-down": "slideDown 1s ease-out",
        "spin-slow": "spin 3s linear infinite",
        "sidebar-slide": "sidebarSlide 0.3s ease-out"
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        slideDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        },
        sidebarSlide: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" }
        }
      },
      transitionProperty: {
        "position": "top, right, bottom, left",
        "size": "width, height",
        "spacing": "margin, padding",
        "sidebar": "transform, opacity"
      },
      boxShadow: {
        "uwrs": "0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 5px 10px -5px rgba(0, 0, 0, 0.1)",
        "uwrs-lg": "0 20px 40px -10px rgba(0, 0, 0, 0.25)",
        "uwrs-sidebar": "4px 0 6px -1px rgba(0, 0, 0, 0.1)"
      },
      borderRadius: {
        "uwrs": "12px",
        "uwrs-lg": "16px",
        "uwrs-full": "9999px"
      },
      spacing: {
        "uwrs-sidebar": "16rem",
        "uwrs-mobile-header": "4rem"
      },
      width: {
        "uwrs-sidebar": "16rem"
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate')
  ]
}