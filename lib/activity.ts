/**
 * Calcul de l'indice d'activité brochet
 * Basé sur: pression, solunar, golden hours, vent, couverture nuageuse
 */

import { WeatherData, PressureTrend } from './weather';
import { SolunarData, SolunarPeriod } from './solunar';

export interface ActivityData {
  score: number;        // 0-5
  label: string;        // "Excellent", "Très bon", etc.
  mainFactor: string;   // Raison principale du score
  color: string;        // Couleur du label
  isGoldenHour: boolean; // Est-on dans une golden hour?
}

/**
 * Calcule les minutes jusqu'à une période solunar
 * Retourne un nombre négatif si la période est en cours
 */
function getMinutesUntilPeriod(
  periods: SolunarPeriod[],
  currentTime: Date
): { minutes: number; isOngoing: boolean } {
  for (const period of periods) {
    // Période en cours
    if (currentTime >= period.start && currentTime <= period.end) {
      return { minutes: 0, isOngoing: true };
    }
    // Période à venir
    if (period.start > currentTime) {
      const diffMs = period.start.getTime() - currentTime.getTime();
      return { minutes: Math.floor(diffMs / (1000 * 60)), isOngoing: false };
    }
  }
  return { minutes: Infinity, isOngoing: false };
}

/**
 * Vérifie si on est dans une golden hour
 * Golden hour matin: 2h après lever
 * Golden hour soir: 2h avant coucher
 */
function checkGoldenHour(
  currentTime: Date,
  sunrise: Date,
  sunset: Date
): { isGolden: boolean; type: 'morning' | 'evening' | null } {
  const twoHoursMs = 2 * 60 * 60 * 1000;

  // Golden hour matin: sunrise → sunrise + 2h
  const sunriseEnd = new Date(sunrise.getTime() + twoHoursMs);
  if (currentTime >= sunrise && currentTime <= sunriseEnd) {
    return { isGolden: true, type: 'morning' };
  }

  // Golden hour soir: sunset - 2h → sunset
  const sunsetStart = new Date(sunset.getTime() - twoHoursMs);
  if (currentTime >= sunsetStart && currentTime <= sunset) {
    return { isGolden: true, type: 'evening' };
  }

  return { isGolden: false, type: null };
}

/**
 * Calcule l'indice d'activité brochet (0-5 étoiles)
 */
export function calculatePikeActivity(
  weather: WeatherData,
  solunar: SolunarData,
  currentTime: Date
): ActivityData {
  let score = 2; // Score de base neutre
  const factors: string[] = [];

  // 1. PRESSION (facteur le plus important pour le brochet)
  if (weather.pressureTrend === 'stable') {
    score += 2;
    factors.push('Pression stable');
  } else if (weather.pressureTrend === 'rising') {
    score += 1;
    factors.push('Pression en hausse');
  } else if (weather.pressureTrend === 'falling') {
    score -= 1;
    factors.push('Pression en baisse');
  }

  // 2. PÉRIODES SOLUNAR
  const majorStatus = getMinutesUntilPeriod(solunar.major, currentTime);
  const minorStatus = getMinutesUntilPeriod(solunar.minor, currentTime);

  if (majorStatus.isOngoing || majorStatus.minutes <= 30) {
    score += 2;
    factors.push('Période majeure');
  } else if (majorStatus.minutes <= 120) {
    score += 1;
    factors.push('Majeure proche');
  } else if (minorStatus.isOngoing || minorStatus.minutes <= 30) {
    score += 1;
    factors.push('Période mineure');
  }

  // 3. GOLDEN HOURS
  const goldenHour = checkGoldenHour(currentTime, solunar.sun.rise, solunar.sun.set);
  if (goldenHour.isGolden) {
    score += 1;
    factors.push(goldenHour.type === 'morning' ? 'Golden hour matin' : 'Golden hour soir');
  }

  // 4. VENT
  const windSpeed = weather.current.windSpeed;
  if (windSpeed >= 8 && windSpeed <= 20) {
    score += 1;
    factors.push('Vent favorable');
  } else if (windSpeed > 30) {
    score -= 1;
    factors.push('Vent trop fort');
  }

  // 5. COUVERTURE NUAGEUSE
  if (weather.current.cloudCover > 70) {
    score += 1;
    factors.push('Temps couvert');
  }

  // Normaliser entre 0 et 5
  score = Math.max(0, Math.min(5, score));

  // Labels et couleurs selon le score
  const config: Record<number, { label: string; color: string }> = {
    0: { label: 'Mauvais', color: '#dc2626' },
    1: { label: 'Faible', color: '#ef4444' },
    2: { label: 'Moyen', color: '#f97316' },
    3: { label: 'Bon', color: '#fbbf24' },
    4: { label: 'Très bon', color: '#84cc16' },
    5: { label: 'Excellent', color: '#22c55e' },
  };

  return {
    score,
    label: config[score].label,
    color: config[score].color,
    mainFactor: factors[0] || 'Conditions neutres',
    isGoldenHour: goldenHour.isGolden,
  };
}

/**
 * Calcule les heures de golden hour pour l'affichage
 */
export function getGoldenHours(sunrise: Date, sunset: Date): {
  morningStart: Date;
  morningEnd: Date;
  eveningStart: Date;
  eveningEnd: Date;
} {
  const twoHoursMs = 2 * 60 * 60 * 1000;

  return {
    morningStart: sunrise,
    morningEnd: new Date(sunrise.getTime() + twoHoursMs),
    eveningStart: new Date(sunset.getTime() - twoHoursMs),
    eveningEnd: sunset,
  };
}
