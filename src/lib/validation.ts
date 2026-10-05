import isIsraeliIdValid from "israeli-id-validator";

export function validateIsraeliId(id: string): boolean {
  return isIsraeliIdValid(id);
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
