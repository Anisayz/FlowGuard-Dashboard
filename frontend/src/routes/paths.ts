/** Central route paths for NavLink, navigate(), and documentation. */
export const PATHS = {
  home: '/',
  firewallRules: '/firewall-rules',
  alerts: '/alerts',
  infrastructure: '/infrastructure',
  ryuHealth: '/health/ryu',
  mitigationEngine: '/health/mitigation-engine',
} as const;

export type PathKey = keyof typeof PATHS;
