export function validateFile(file, { allowedTypes, maxSizeMb, label = "File" }) {
  // Returns a readable validation error, or an empty string when the file is valid.
  if (!file) return `${label} is required.`; // A file must be selected first.

  if (allowedTypes && !allowedTypes.includes(file.type)) { // Checks the browser-reported file type.
    return `${label} has an unsupported file type.`;
  }

  if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) { // Converts megabytes to bytes for comparison.
    return `${label} must be no larger than ${maxSizeMb} MB.`;
  }

  return "";
}

