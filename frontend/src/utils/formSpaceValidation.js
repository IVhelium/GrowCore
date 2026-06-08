export function getTrimmedFormData(form) {
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (value instanceof File) {
      data[key] = value;
      continue;
    }

    data[key] = String(value).trim();
  }

  return data;
}

export function hasEmptyRequiredFields(data, requiredFields = []) {
  return requiredFields.some((field) => {
    const value = data[field];

    if (value instanceof File) {
      return !value.name;
    }

    return !String(value || "").trim();
  });
}

export function getEmptyFieldMessage() {
  return "Fill in all required fields. Spaces only are not allowed.";
}
