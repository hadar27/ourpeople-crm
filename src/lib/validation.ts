import isIsraeliIdValid from "israeli-id-validator";

export function validateIsraeliId(id: string): boolean {
  return isIsraeliIdValid(id);
}
