export function validateFile(file, { allowedTypes, maxSizeMb, label = "File" }) {
  if (!file) return `${label} is required.`;

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    return `${label} has an unsupported file type.`;
  }

  if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
    return `${label} must be no larger than ${maxSizeMb} MB.`;
  }

  return "";
}

