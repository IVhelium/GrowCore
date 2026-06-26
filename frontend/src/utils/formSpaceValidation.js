export function getTrimmedFormData(form) {
  // Removes accidental spaces around every text field before validation.
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
  // Checks whether any required field is empty after trimming spaces.
  return requiredFields.some((field) => {
    const value = data[field];

    if (value instanceof File) {
      return !value.name;
    }

    return !String(value || "").trim();
  });
}

export function getEmptyFieldMessage() {
  // Provides the shared message shown for incomplete forms.
  return "Fill in all required fields. Spaces only are not allowed.";
}
