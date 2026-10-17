export const NICKNAME_MAX = 40;
export const WATER_MIN = 1;
export const WATER_MAX = 60;

export type PlantFormErrors = { nickname?: string; waterEveryDays?: string };

export function validatePlantForm(input: { nickname: string; waterEveryDays: number }): PlantFormErrors {
  const errors: PlantFormErrors = {};
  const name = input.nickname.trim();
  if (!name) errors.nickname = 'Give your plant a name.';
  else if (name.length > NICKNAME_MAX) errors.nickname = `Keep it under ${NICKNAME_MAX} characters.`;
  if (!Number.isInteger(input.waterEveryDays) || input.waterEveryDays < WATER_MIN || input.waterEveryDays > WATER_MAX) {
    errors.waterEveryDays = `Choose between ${WATER_MIN} and ${WATER_MAX} days.`;
  }
  return errors;
}

/** Store an override only when it differs from the care guide's default. */
export function waterOverride(chosen: number, guideDefault: number | undefined): number | null {
  return guideDefault !== undefined && chosen === guideDefault ? null : chosen;
}

/** Suggest a friendly nickname from the species name ("Monstera" -> "Monstera"). */
export function suggestNickname(speciesName: string | undefined): string {
  return speciesName ? speciesName.split(/[,(]/)[0].trim() : '';
}
