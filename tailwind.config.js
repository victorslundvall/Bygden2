/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./src/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: [
            '"InterVariable"',
            '"RobotoVariable"',
            '"OpenSansVariable"',
            'ui-sans-serif',
            'system-ui',
            'sans-serif',
          ],
        },
      },
    },
    plugins: [],
  }