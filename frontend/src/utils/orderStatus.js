export function humanizeStatus(value) {
  return value?.replaceAll("_", " ") || "-";
}
