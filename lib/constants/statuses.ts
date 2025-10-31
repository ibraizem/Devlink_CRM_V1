export const STATUS_OPTIONS = [
  'RDV Planifié',
  'RDV OK',
  'RDV KO',
  'Recruté',
  'Ne répond pas',
  'À relanifier',
  'Relance',
  'Rappel personnel',
  'Injoignable permanent',
  'Hors cible',
  'Pas intéressé',
  'Refus MDP'
] as const;

export type StatusType = typeof STATUS_OPTIONS[number];
