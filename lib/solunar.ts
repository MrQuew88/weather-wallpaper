/**
 * Service solunar
 * Ce module calcule les données solunar (phases lunaires, périodes d'activité)
 * pour la pêche en utilisant la librairie suncalc
 */

import * as SunCalc from 'suncalc';

// ============================================================================
// Types pour le retour du service
// ============================================================================

/** Noms des phases lunaires en français */
export type MoonPhaseName =
  | 'Nouvelle lune'
  | 'Premier croissant'
  | 'Premier quartier'
  | 'Gibbeuse croissante'
  | 'Pleine lune'
  | 'Gibbeuse décroissante'
  | 'Dernier quartier'
  | 'Dernier croissant';

/** Données lunaires */
export interface MoonData {
  phase: number; // 0-1 (0 = nouvelle lune, 0.5 = pleine lune)
  phaseName: MoonPhaseName;
  illumination: number; // pourcentage 0-100
  rise: Date | null;
  set: Date | null;
}

/** Données solaires */
export interface SunData {
  rise: Date;
  set: Date;
}

/** Période solunar majeure (transit ou nadir) */
export interface MajorPeriod {
  start: Date;
  end: Date;
  type: 'transit' | 'nadir';
}

/** Période solunar mineure (lever ou coucher de lune) */
export interface MinorPeriod {
  start: Date;
  end: Date;
  type: 'moonrise' | 'moonset';
}

/** Données solunar complètes */
export interface SolunarData {
  moon: MoonData;
  sun: SunData;
  major: MajorPeriod[];
  minor: MinorPeriod[];
}

// ============================================================================
// Fonctions utilitaires
// ============================================================================

/**
 * Convertit la fraction de phase lunaire en nom français
 * La phase va de 0 à 1 :
 * - 0 = nouvelle lune
 * - 0.25 = premier quartier
 * - 0.5 = pleine lune
 * - 0.75 = dernier quartier
 * @param phase - Fraction de phase (0-1)
 * @returns Nom de la phase en français
 */
export function getMoonPhaseName(phase: number): MoonPhaseName {
  // Normaliser la phase entre 0 et 1
  const normalizedPhase = ((phase % 1) + 1) % 1;

  if (normalizedPhase < 0.0625) {
    return 'Nouvelle lune';
  } else if (normalizedPhase < 0.1875) {
    return 'Premier croissant';
  } else if (normalizedPhase < 0.3125) {
    return 'Premier quartier';
  } else if (normalizedPhase < 0.4375) {
    return 'Gibbeuse croissante';
  } else if (normalizedPhase < 0.5625) {
    return 'Pleine lune';
  } else if (normalizedPhase < 0.6875) {
    return 'Gibbeuse décroissante';
  } else if (normalizedPhase < 0.8125) {
    return 'Dernier quartier';
  } else if (normalizedPhase < 0.9375) {
    return 'Dernier croissant';
  } else {
    return 'Nouvelle lune';
  }
}

/**
 * Crée une fenêtre temporelle centrée autour d'une date
 * @param center - Date centrale
 * @param durationMinutes - Durée totale de la fenêtre en minutes
 * @returns Objet avec start et end
 */
function createTimeWindow(
  center: Date,
  durationMinutes: number
): { start: Date; end: Date } {
  const halfDuration = (durationMinutes / 2) * 60 * 1000; // en millisecondes
  return {
    start: new Date(center.getTime() - halfDuration),
    end: new Date(center.getTime() + halfDuration),
  };
}

/**
 * Trouve le moment du transit lunaire (lune au zénith) pour une date donnée
 * Le transit est le moment où la lune atteint son altitude maximale
 * @param date - Date de référence
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Date du transit ou null si non trouvé
 */
function findMoonTransit(date: Date, lat: number, lon: number): Date | null {
  // On cherche le maximum d'altitude sur 24h en échantillonnant toutes les 10 minutes
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  let maxAltitude = -Infinity;
  let transitTime: Date | null = null;

  // Échantillonnage grossier toutes les 10 minutes
  for (let minutes = 0; minutes < 24 * 60; minutes += 10) {
    const checkTime = new Date(startOfDay.getTime() + minutes * 60 * 1000);
    const position = SunCalc.getMoonPosition(checkTime, lat, lon);

    if (position.altitude > maxAltitude) {
      maxAltitude = position.altitude;
      transitTime = checkTime;
    }
  }

  // Affinage autour du maximum trouvé (recherche minute par minute)
  if (transitTime) {
    const searchStart = new Date(transitTime.getTime() - 10 * 60 * 1000);
    const searchEnd = new Date(transitTime.getTime() + 10 * 60 * 1000);

    maxAltitude = -Infinity;
    let refinedTransit = transitTime;

    for (
      let t = searchStart.getTime();
      t <= searchEnd.getTime();
      t += 60 * 1000
    ) {
      const checkTime = new Date(t);
      const position = SunCalc.getMoonPosition(checkTime, lat, lon);

      if (position.altitude > maxAltitude) {
        maxAltitude = position.altitude;
        refinedTransit = checkTime;
      }
    }

    return refinedTransit;
  }

  return null;
}

// ============================================================================
// Fonction principale
// ============================================================================

/**
 * Récupère les données solunar pour une position et une date données
 * @param lat - Latitude
 * @param lon - Longitude
 * @param date - Date de référence
 * @returns Données solunar complètes
 */
export function getSolunarData(
  lat: number,
  lon: number,
  date: Date
): SolunarData {
  // Récupérer les données de base via suncalc
  const moonIllumination = SunCalc.getMoonIllumination(date);
  const moonTimes = SunCalc.getMoonTimes(date, lat, lon);
  const sunTimes = SunCalc.getTimes(date, lat, lon);

  // Construire les données lunaires
  const moon: MoonData = {
    phase: moonIllumination.phase,
    phaseName: getMoonPhaseName(moonIllumination.phase),
    illumination: Math.round(moonIllumination.fraction * 100),
    // Gérer les cas de lune circumpolaire (toujours visible ou jamais visible)
    rise: moonTimes.rise instanceof Date ? moonTimes.rise : null,
    set: moonTimes.set instanceof Date ? moonTimes.set : null,
  };

  // Construire les données solaires
  const sun: SunData = {
    rise: sunTimes.sunrise,
    set: sunTimes.sunset,
  };

  // Calculer les périodes majeures (transit et nadir)
  const major: MajorPeriod[] = [];
  const transit = findMoonTransit(date, lat, lon);

  if (transit) {
    // Période majeure au transit (lune au zénith) - 2h
    const transitWindow = createTimeWindow(transit, 120);
    major.push({
      start: transitWindow.start,
      end: transitWindow.end,
      type: 'transit',
    });

    // Période majeure au nadir (opposé du transit, ~12h après) - 2h
    const nadir = new Date(transit.getTime() + 12 * 60 * 60 * 1000);
    const nadirWindow = createTimeWindow(nadir, 120);
    major.push({
      start: nadirWindow.start,
      end: nadirWindow.end,
      type: 'nadir',
    });
  }

  // Calculer les périodes mineures (lever et coucher de lune)
  const minor: MinorPeriod[] = [];

  if (moon.rise) {
    // Période mineure au lever de lune - 1h
    const moonriseWindow = createTimeWindow(moon.rise, 60);
    minor.push({
      start: moonriseWindow.start,
      end: moonriseWindow.end,
      type: 'moonrise',
    });
  }

  if (moon.set) {
    // Période mineure au coucher de lune - 1h
    const moonsetWindow = createTimeWindow(moon.set, 60);
    minor.push({
      start: moonsetWindow.start,
      end: moonsetWindow.end,
      type: 'moonset',
    });
  }

  return {
    moon,
    sun,
    major,
    minor,
  };
}
