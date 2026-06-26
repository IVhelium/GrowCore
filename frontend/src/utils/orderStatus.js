export function humanizeStatus(value) {
  // Changes a machine-readable status into words suitable for the interface.
  return value?.replaceAll("_", " ") || "-";
}
