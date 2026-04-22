export function trimString(value: unknown) {
  return typeof value === 'string' ? value.trim() : value;
}

export function trimLowercaseString(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

export function trimUppercaseString(value: unknown) {
  return typeof value === 'string' ? value.trim().toUpperCase() : value;
}

export function trimStringToUndefined(value: unknown) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}
