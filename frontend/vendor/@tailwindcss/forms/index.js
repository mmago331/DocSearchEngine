import plugin from 'tailwindcss/plugin';

export default plugin(function({ addBase }) {
  addBase({
    'input, textarea, select, multiselect': {
      backgroundColor: 'transparent',
      borderColor: '#d1d5db',
      borderRadius: '0.5rem',
      padding: '0.5rem 0.75rem'
    },
    'input:focus, textarea:focus, select:focus, multiselect:focus': {
      outline: 'none',
      boxShadow: '0 0 0 1px rgb(79 70 229 / 0.4)'
    }
  });
});
