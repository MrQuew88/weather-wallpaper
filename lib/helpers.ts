/**
 * Fonctions utilitaires pour le wallpaper météo
 * Ce module contient les helpers pour la conversion et le formatage des données
 */

import { PressureTrend } from './weather';

// ============================================================================
// Conversion de direction du vent
// ============================================================================

/**
 * Convertit la direction du vent (en degrés) en flèche Unicode
 * Le vent vient DE la direction indiquée, donc:
 * - 0° = Nord = le vent vient du nord → flèche vers le bas ↓
 * - 90° = Est = le vent vient de l'est → flèche vers la gauche ←
 * - 180° = Sud = le vent vient du sud → flèche vers le haut ↑
 * - 270° = Ouest = le vent vient de l'ouest → flèche vers la droite →
 * @param degrees - Direction du vent en degrés (0-360)
 * @returns Flèche Unicode correspondante
 */
export function getWindArrow(degrees: number): string {
  // Normaliser les degrés entre 0 et 360
  const normalized = ((degrees % 360) + 360) % 360;

  // Tableau des flèches pour 8 directions principales
  // Index 0 = Nord (337.5° - 22.5°), etc.
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];

  // Calculer l'index (chaque secteur fait 45°)
  // On ajoute 22.5° pour centrer les secteurs
  const index = Math.round((normalized + 22.5) / 45) % 8;

  return arrows[index];
}

// ============================================================================
// Conversion des codes météo WMO en emoji
// ============================================================================

/**
 * Convertit un code météo WMO en emoji correspondant
 * Référence: https://open-meteo.com/en/docs
 * @param code - Code météo WMO
 * @returns Emoji météo
 */
export function getWeatherEmoji(code: number): string {
  // 0: Ciel clair
  if (code === 0) return '☀️';

  // 1-3: Principalement clair, partiellement nuageux, couvert
  if (code === 1) return '🌤';
  if (code === 2) return '⛅';
  if (code === 3) return '☁️';

  // 45, 48: Brouillard et brouillard givrant
  if (code === 45 || code === 48) return '🌫';

  // 51, 53, 55: Bruine légère, modérée, dense
  if (code >= 51 && code <= 55) return '🌧';

  // 56, 57: Bruine verglaçante
  if (code === 56 || code === 57) return '🌧';

  // 61, 63, 65: Pluie légère, modérée, forte
  if (code >= 61 && code <= 65) return '🌧';

  // 66, 67: Pluie verglaçante
  if (code === 66 || code === 67) return '🌧';

  // 71, 73, 75: Neige légère, modérée, forte
  if (code >= 71 && code <= 75) return '🌨';

  // 77: Grains de neige
  if (code === 77) return '🌨';

  // 80, 81, 82: Averses légères, modérées, violentes
  if (code >= 80 && code <= 82) return '🌧';

  // 85, 86: Averses de neige
  if (code === 85 || code === 86) return '🌨';

  // 95: Orage
  if (code === 95) return '⛈';

  // 96, 99: Orage avec grêle
  if (code === 96 || code === 99) return '⛈';

  // Par défaut
  return '☁️';
}

// ============================================================================
// Formatage des heures
// ============================================================================

/**
 * Formate une date en heure complète (ex: "14h30")
 * @param date - Date à formater
 * @returns Heure formatée
 */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}

/**
 * Formate une date en heure courte (ex: "14h")
 * @param date - Date à formater
 * @returns Heure formatée sans minutes
 */
export function formatHour(date: Date): string {
  return `${date.getHours()}h`;
}

/**
 * Formate un timestamp ISO en heure courte (ex: "14h")
 * @param isoString - Timestamp ISO (ex: "2024-01-15T14:00")
 * @returns Heure formatée
 */
export function formatHourFromISO(isoString: string): string {
  const date = new Date(isoString);
  return formatHour(date);
}

// ============================================================================
// Calcul du countdown
// ============================================================================

/**
 * Calcule le temps restant entre maintenant et une date cible
 * @param now - Date actuelle
 * @param target - Date cible
 * @returns Texte formaté (ex: "dans 2h15" ou "dans 45min")
 */
export function getCountdown(now: Date, target: Date): string {
  const diffMs = target.getTime() - now.getTime();

  // Si la date est passée
  if (diffMs < 0) {
    return 'passé';
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours === 0) {
    return `dans ${minutes}min`;
  }

  if (minutes === 0) {
    return `dans ${hours}h`;
  }

  return `dans ${hours}h${minutes.toString().padStart(2, '0')}`;
}

// ============================================================================
// Tendance de pression
// ============================================================================

/**
 * Convertit une tendance de pression en flèche
 * @param trend - Tendance ('rising', 'falling', 'stable')
 * @returns Flèche correspondante
 */
export function getPressureTrendArrow(trend: PressureTrend): string {
  switch (trend) {
    case 'rising':
      return '↗';
    case 'falling':
      return '↘';
    case 'stable':
      return '→';
    default:
      return '→';
  }
}

// ============================================================================
// Gestion des périodes solunar
// ============================================================================

/**
 * Trouve la prochaine période solunar (majeure ou mineure)
 * @param periods - Tableau des périodes
 * @param now - Date actuelle
 * @returns La prochaine période ou null si aucune
 */
export function getNextPeriod<T extends { start: Date; end: Date }>(
  periods: T[],
  now: Date
): { period: T; status: 'upcoming' | 'ongoing' } | null {
  for (const period of periods) {
    // Période en cours
    if (period.start <= now && period.end >= now) {
      return { period, status: 'ongoing' };
    }

    // Prochaine période
    if (period.start > now) {
      return { period, status: 'upcoming' };
    }
  }

  return null;
}

/**
 * Formate l'affichage d'une période solunar
 * @param period - Période à afficher
 * @param now - Date actuelle
 * @returns { time: string, countdown: string }
 */
export function formatSolunarPeriod(
  period: { start: Date; end: Date } | null,
  now: Date,
  status: 'upcoming' | 'ongoing' | null
): { time: string; countdown: string } {
  if (!period || !status) {
    return { time: '—', countdown: '' };
  }

  if (status === 'ongoing') {
    return { time: formatTime(period.start), countdown: 'En cours' };
  }

  return { time: formatTime(period.start), countdown: getCountdown(now, period.start) };
}

// ============================================================================
// Palette de couleurs
// ============================================================================

export const colors = {
  bgDark: '#0d1b2a',
  bgMid: '#0a1628',
  textPrimary: '#ffffff',
  textSecondary: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  accent: '#7dd3fc',
  accentWarm: '#fbbf24',
  accentOrange: '#f97316',
  success: '#34d399',
  error: '#f87171',
} as const;
