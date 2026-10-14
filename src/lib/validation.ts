import isIsraeliIdValid from "israeli-id-validator";

export function validateIsraeliId(id: string): boolean {
  return /^\d{9}$/.test(id) && id !== "000000000" && isIsraeliIdValid(id);
}

export function isMinor(dateOfBirth: string, today = new Date()): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOfBirth);
  if (!match) return false;

  const birthYear = Number(match[1]);
  const birthMonth = Number(match[2]);
  const birthDay = Number(match[3]);
  if (birthMonth < 1 || birthMonth > 12 || birthDay < 1 || birthDay > 31)
    return false;

  let age = today.getFullYear() - birthYear;
  const birthdayPassed =
    today.getMonth() + 1 > birthMonth ||
    (today.getMonth() + 1 === birthMonth && today.getDate() >= birthDay);
  if (!birthdayPassed) age -= 1;
  return age >= 0 && age < 18;
}

/** Shared limits for identity/company numbers and local phone fields. */
export function numericFieldLength(
  name: string,
  type?: string,
): number | undefined {
  if (name === "idNumber" || name === "taxId") return 9;
  if (type === "tel" || name.toLowerCase().endsWith("phone")) return 10;
  return undefined;
}

export function normalizeNumericField(
  name: string,
  value: string,
  type?: string,
): string {
  const length = numericFieldLength(name, type);
  return length ? value.replace(/\D/g, "").slice(0, length) : value;
}

export function validateNumericField(
  name: string,
  value: string,
  type?: string,
): string | null {
  const length = numericFieldLength(name, type);
  if (!value || !length) return null;
  if (length === 9 && !validateIsraeliId(value))
    return "יש להזין ת.ז./ח.פ. תקינה בת 9 ספרות";
  if (length === 10 && !/^\d{10}$/.test(value))
    return "מספר טלפון חייב להכיל 10 ספרות";
  return null;
}
