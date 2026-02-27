/** Types de documents supportés */
export const DOCUMENT_TYPES = [
  { value: 'cours', label: 'Cours' },
  { value: 'examen', label: 'Examen' },
  { value: 'td', label: 'TD' },
  { value: 'tp', label: 'TP' },
  { value: 'expose', label: 'Exposé' },
];

/** Niveaux universitaires */
export const NIVEAUX = ['L1', 'L2', 'L3', 'M1', 'M2'];

/** Extensions de fichier autorisées */
export const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png'];

/** Taille max d'upload en octets (16 Mo) */
export const MAX_FILE_SIZE = 16 * 1024 * 1024;

/** Nombre de résultats par page par défaut */
export const DEFAULT_PER_PAGE = 20;
