function toVal(mix) {
  if (typeof mix === "string" || typeof mix === "number") return mix;
  if (typeof mix === "boolean" || mix == null) return "";
  if (Array.isArray(mix)) {
    return mix.map(toVal).filter(Boolean).join(" ");
  }
  if (typeof mix === "object") {
    return Object.keys(mix)
      .filter(key => mix[key])
      .join(" ");
  }
  return "";
}

export function clsx(...inputs) {
  return inputs.map(toVal).filter(Boolean).join(" ");
}

export default clsx;
