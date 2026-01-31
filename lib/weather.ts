/**
 * Service météo
 * Ce module récupère les données météorologiques via l'API Open-Meteo
 */

// ============================================================================
// Types pour la réponse de l'API Open-Meteo
// ============================================================================

interface OpenMeteoCurrentResponse {
  time: string;
  temperature_2m: number;
  apparent_temperature: number;
  wind_speed_10m: number;
  wind_direction_10m: number;
  wind_gusts_10m: number;
  pressure_msl: number;
  cloud_cover: number;
  precipitation: number;
  weather_code: number;
}

interface OpenMeteoHourlyResponse {
  time: string[];
  temperature_2m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  wind_speed_10m: number[];
  wind_gusts_10m: number[];
  wind_direction_10m: number[];
  weather_code: number[];
  pressure_msl: number[];
}

interface OpenMeteoResponse {
  current: OpenMeteoCurrentResponse;
  hourly: OpenMeteoHourlyResponse;
}

// ============================================================================
// Types pour le retour de notre service
// ============================================================================

export interface CurrentWeather {
  temperature: number;
  feelsLike: number;
  windSpeed: number;
  windDirection: number;
  windGusts: number;
  pressure: number;
  cloudCover: number;
  precipitation: number;
  weatherCode: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  precipitationProbability: number;
  precipitation: number;      // mm de pluie
  windSpeed: number;
  windGusts: number;          // rafales en km/h
  windDirection: number;      // direction en degrés
  weatherCode: number;
}

export type PressureTrend = 'rising' | 'falling' | 'stable';

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  pressureTrend: PressureTrend;
}

// ============================================================================
// Fonctions utilitaires
// ============================================================================

/**
 * Calcule la tendance de pression en comparant la valeur actuelle
 * avec celle d'il y a 3 heures
 * @param currentPressure - Pression actuelle en hPa
 * @param pressureHistory - Tableau des pressions horaires passées
 * @param currentTimeIndex - Index de l'heure actuelle dans le tableau
 * @returns La tendance : 'rising', 'falling' ou 'stable'
 */
function calculatePressureTrend(
  currentPressure: number,
  pressureHistory: number[],
  currentTimeIndex: number
): PressureTrend {
  // On cherche la pression d'il y a 3 heures
  const threeHoursAgoIndex = currentTimeIndex - 3;

  // Si on n'a pas assez de données historiques, retourner 'stable'
  if (threeHoursAgoIndex < 0 || !pressureHistory[threeHoursAgoIndex]) {
    return 'stable';
  }

  const pastPressure = pressureHistory[threeHoursAgoIndex];
  const difference = currentPressure - pastPressure;

  // Seuil de 1 hPa pour considérer un changement significatif
  const threshold = 1;

  if (difference > threshold) {
    return 'rising';
  } else if (difference < -threshold) {
    return 'falling';
  }

  return 'stable';
}

/**
 * Trouve l'index de l'heure actuelle dans le tableau des heures
 * @param times - Tableau des timestamps ISO
 * @returns L'index de l'heure actuelle ou 0 si non trouvé
 */
function findCurrentHourIndex(times: string[]): number {
  const now = new Date();
  const currentHour = now.toISOString().slice(0, 13); // Format: "2024-01-15T14"

  const index = times.findIndex((time) => time.startsWith(currentHour));
  return index >= 0 ? index : 0;
}

// ============================================================================
// Fonction principale
// ============================================================================

/**
 * Récupère les données météo depuis l'API Open-Meteo
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Les données météo formatées
 * @throws Error si l'appel API échoue
 */
export async function getWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData> {
  // Construction de l'URL avec tous les paramètres requis
  const baseUrl = 'https://api.open-meteo.com/v1/forecast';
  const currentParams = [
    'temperature_2m',
    'apparent_temperature',
    'wind_speed_10m',
    'wind_direction_10m',
    'wind_gusts_10m',
    'pressure_msl',
    'cloud_cover',
    'precipitation',
    'weather_code',
  ].join(',');

  const hourlyParams = [
    'temperature_2m',
    'precipitation_probability',
    'precipitation',
    'wind_speed_10m',
    'wind_gusts_10m',
    'wind_direction_10m',
    'weather_code',
    'pressure_msl', // Pour calculer la tendance de pression
  ].join(',');

  const url = `${baseUrl}?latitude=${lat}&longitude=${lon}&current=${currentParams}&hourly=${hourlyParams}&timezone=auto`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erreur API Open-Meteo: ${response.status}`);
    }

    const data: OpenMeteoResponse = await response.json();

    // Trouver l'index de l'heure actuelle pour extraire les 3 prochaines heures
    const currentIndex = findCurrentHourIndex(data.hourly.time);

    // Extraire les 3 prochaines heures de prévisions
    const hourlyForecasts: HourlyForecast[] = [];
    for (let i = 0; i < 3; i++) {
      const idx = currentIndex + i + 1; // +1 car on veut les heures futures
      if (idx < data.hourly.time.length) {
        hourlyForecasts.push({
          time: data.hourly.time[idx],
          temperature: data.hourly.temperature_2m[idx],
          precipitationProbability: data.hourly.precipitation_probability[idx],
          precipitation: data.hourly.precipitation[idx],
          windSpeed: data.hourly.wind_speed_10m[idx],
          windGusts: data.hourly.wind_gusts_10m[idx],
          windDirection: data.hourly.wind_direction_10m[idx],
          weatherCode: data.hourly.weather_code[idx],
        });
      }
    }

    // Calculer la tendance de pression
    const pressureTrend = calculatePressureTrend(
      data.current.pressure_msl,
      data.hourly.pressure_msl,
      currentIndex
    );

    // Construire et retourner l'objet de données météo
    return {
      current: {
        temperature: data.current.temperature_2m,
        feelsLike: data.current.apparent_temperature,
        windSpeed: data.current.wind_speed_10m,
        windDirection: data.current.wind_direction_10m,
        windGusts: data.current.wind_gusts_10m,
        pressure: data.current.pressure_msl,
        cloudCover: data.current.cloud_cover,
        precipitation: data.current.precipitation,
        weatherCode: data.current.weather_code,
      },
      hourly: hourlyForecasts,
      pressureTrend,
    };
  } catch (error) {
    // Gestion d'erreur basique avec re-throw
    if (error instanceof Error) {
      throw new Error(`Échec de récupération météo: ${error.message}`);
    }
    throw new Error('Échec de récupération météo: erreur inconnue');
  }
}

// ============================================================================
// Température de l'eau (optionnel)
// ============================================================================

/**
 * Récupère la température de l'eau via l'API Marine Open-Meteo
 * Retourne null si non disponible (lacs intérieurs, erreur, etc.)
 * @param lat - Latitude
 * @param lon - Longitude
 * @returns Température de l'eau en °C ou null
 */
export async function getWaterTemperature(
  lat: number,
  lon: number
): Promise<number | null> {
  try {
    const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=water_temperature`;
    const response = await fetch(url);

    if (!response.ok) {
      return null; // API marine non disponible pour ce lieu
    }

    const data = await response.json();
    return data.current?.water_temperature ?? null;
  } catch {
    return null; // Pas disponible pour ce lieu (lac intérieur, etc.)
  }
}
