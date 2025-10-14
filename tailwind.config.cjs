/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './backend/dist/public/ui/**/*.html',
    './backend/dist/views/**/*.ejs'
  ],
  theme: {
    extend: {}
  },
  plugins: [require('@tailwindcss/forms')]
};
