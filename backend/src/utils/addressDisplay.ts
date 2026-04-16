/** Strip trailing US state + ZIP (and optional country) from a typical Google-style formatted address. */
export function addressUpToCity(formattedAddress: string): string {
  const original = formattedAddress.trim();
  if (!original) return original;

  let s = original.replace(/,?\s*(United States|USA|US)\s*$/i, "").trim();

  const parts = s
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (parts.length === 0) return original;

  const stateZip = /^[A-Z]{2}\s+\d{5}(-\d{4})?$/i;
  const stateOnly = /^[A-Z]{2}$/i;

  while (parts.length > 0) {
    const last = parts[parts.length - 1]!;
    if (stateZip.test(last) || stateOnly.test(last)) {
      parts.pop();
      continue;
    }
    break;
  }

  return parts.length > 0 ? parts.join(", ") : original;
}
