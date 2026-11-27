/** Deixa o texto comparável: sem acentos, minúsculo e sem espaços nas pontas. "Atacante " → "atacante". */
export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
