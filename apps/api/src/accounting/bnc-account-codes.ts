/**
 * BNC (Bénéfices Non Commerciaux) account codes for French Plan Comptable
 * Used for FEC export and 2035 tax declaration mapping.
 */
export const BNC_ACCOUNT_CODES: Record<string, { code: string; label: string }> = {
  HONORAIRES:        { code: '706000', label: 'Honoraires' },
  rent:              { code: '613200', label: 'Locations immobilieres' },
  insurance:         { code: '616000', label: "Primes d'assurance" },
  equipment:         { code: '218400', label: 'Materiel de bureau et informatique' },
  it_software:       { code: '651000', label: 'Redevances et logiciels' },
  phone_internet:    { code: '626000', label: 'Frais postaux et telecommunications' },
  training:          { code: '618500', label: 'Seminaires, conferences, formations' },
  supervision:       { code: '622600', label: 'Honoraires ne constituant pas des retrocessions' },
  professional_fees: { code: '628100', label: 'Cotisations syndicales et professionnelles' },
  transport:         { code: '625100', label: 'Voyages et deplacements' },
  office_supplies:   { code: '606400', label: 'Fournitures de bureau' },
  tests_tools:       { code: '606800', label: 'Autres matieres et fournitures' },
  bank_fees:         { code: '627000', label: 'Frais bancaires' },
  accounting:        { code: '622700', label: "Frais d'actes et de contentieux" },
  cleaning:          { code: '615500', label: 'Entretien et reparations' },
  other:             { code: '671000', label: 'Charges diverses' },
  cfe:               { code: '635100', label: 'Cotisation fonciere des entreprises' },
};

/**
 * Map ExpenseCategory values to 2035 Cerfa declaration lines.
 * Line codes match the official Cerfa n°11176 (déclaration BNC 2035).
 */
export const CATEGORY_TO_2035_LINE: Record<string, string> = {
  rent:              'BA',  // Achats
  insurance:         'BS',  // Assurances
  equipment:         'BM',  // Petit outillage
  it_software:       'BM',  // Petit outillage
  phone_internet:    'BQ',  // Transports & déplacements / Autres frais
  training:          'CO',  // Autres impôts (formation)
  supervision:       'BT',  // Honoraires ne constituant pas des rétrocessions
  professional_fees: 'BV',  // Cotisations syndicales et professionnelles
  transport:         'BQ',  // Transports et déplacements
  office_supplies:   'BA',  // Achats
  tests_tools:       'BA',  // Achats
  bank_fees:         'CB',  // Charges financières
  accounting:        'BT',  // Honoraires
  cleaning:          'BP',  // Entretien et réparations
  other:             'CP',  // Autres charges
};
