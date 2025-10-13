import plugin from "tailwindcss/plugin";

export default plugin(({ addBase }) => {
  addBase({
    'input, textarea, select': {
      appearance: "none",
      backgroundColor: "transparent",
      borderColor: "inherit",
      borderRadius: "inherit",
      fontSize: "inherit",
      lineHeight: "inherit",
      paddingTop: "0.5rem",
      paddingBottom: "0.5rem",
      paddingLeft: "0.75rem",
      paddingRight: "0.75rem"
    },
    'input:focus, textarea:focus, select:focus': {
      outline: "2px solid transparent",
      outlineOffset: "2px"
    }
  });
});
