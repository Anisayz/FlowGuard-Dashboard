/** Libellés français pour valeurs techniques renvoyées par l’API */

export function uiHealth(value: string | undefined): string {
  if (value == null || value === '') return '—';
  const v = value.toLowerCase();
  if (v === 'healthy') return 'Opérationnel';
  if (v === 'unhealthy') return 'Indisponible';
  return value;
}

export function uiRyuState(value: string | undefined): string {
  if (value == null || value === '') return '—';
  const v = value.toLowerCase();
  if (v === 'up') return 'Actif';
  if (v === 'down') return 'Inactif';
  if (v === 'unknown') return 'Inconnu';
  return value;
}

export function uiSeverity(value: string): string {
  const v = value.toLowerCase();
  const map: Record<string, string> = {
    critical: 'Critique',
    high: 'Élevée',
    medium: 'Moyenne',
    low: 'Faible',
  };
  return map[v] ?? value;
}

export function uiAlertStatus(value: string): string {
  const v = value.toLowerCase();
  const map: Record<string, string> = {
    blocked: 'Bloqué',
    mitigated: 'Atténué',
    monitoring: 'Surveillance',
    resolved: 'Résolu',
  };
  return map[v] ?? value;
}
