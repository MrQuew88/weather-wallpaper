/**
 * Route API pour la génération du fond d'écran météo
 * Utilise @vercel/og pour générer une image PNG dynamique
 */

import { ImageResponse } from '@vercel/og';
import { getWeatherData } from '../../../lib/weather';
import { getSolunarData } from '../../../lib/solunar';
import {
  getWindArrow,
  getWeatherEmoji,
  formatTime,
  formatHourFromISO,
  getPressureTrendArrow,
  getNextPeriod,
  formatSolunarPeriod,
  colors,
} from '../../../lib/helpers';

// Configuration edge runtime pour meilleures performances
export const runtime = 'edge';

// Dimensions du wallpaper (iPhone 15 Pro Max)
const WIDTH = 1179;
const HEIGHT = 2556;

/**
 * Gestionnaire GET pour générer le fond d'écran
 * Query params:
 * - lat (required): latitude
 * - lon (required): longitude
 * - name (required): nom du lieu
 * - region (optional): région/pays
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Extraction des paramètres
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lon = parseFloat(searchParams.get('lon') || '0');
  const name = searchParams.get('name') || 'Position';
  const region = searchParams.get('region') || '';

  // Validation basique
  if (lat === 0 && lon === 0) {
    return new Response('Paramètres lat et lon requis', { status: 400 });
  }

  try {
    // Récupération des données
    const weather = await getWeatherData(lat, lon);
    const solunar = getSolunarData(lat, lon, new Date());
    const now = new Date();

    // Préparer les données solunar
    const nextMajor = getNextPeriod(solunar.major, now);
    const nextMinor = getNextPeriod(solunar.minor, now);
    const majorDisplay = formatSolunarPeriod(
      nextMajor?.period || null,
      now,
      nextMajor?.status || null
    );
    const minorDisplay = formatSolunarPeriod(
      nextMinor?.period || null,
      now,
      nextMinor?.status || null
    );

    // Calculer le pourcentage illuminé pour la phase lunaire
    const moonIllumination = solunar.moon.illumination;
    // Pour le gradient de la lune : la partie illuminée va de 0% à 100%
    const moonGradientStop = 100 - moonIllumination;

    return new ImageResponse(
      (
        <div
          style={{
            width: WIDTH,
            height: HEIGHT,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            background: `linear-gradient(180deg, ${colors.bgDark} 0%, ${colors.bgMid} 30%, #0f1d2f 70%, #0d1926 100%)`,
            position: 'relative',
          }}
        >
          {/* Safe zone top */}
          <div style={{ height: 200, display: 'flex' }} />

          {/* Content area */}
          <div
            style={{
              flex: 1,
              padding: '40px 70px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Location */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 600,
                  color: colors.textSecondary,
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {name}
              </div>
              {region && (
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 400,
                    color: colors.textDim,
                    marginTop: 8,
                    letterSpacing: '0.05em',
                  }}
                >
                  {region}
                </div>
              )}
            </div>

            {/* Hero: Current Conditions */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '40px 0 50px',
                position: 'relative',
              }}
            >
              {/* Temperature main */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  lineHeight: 0.85,
                }}
              >
                <span
                  style={{
                    fontSize: 280,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    letterSpacing: '-0.04em',
                  }}
                >
                  {Math.round(weather.current.temperature)}
                </span>
                <span
                  style={{
                    fontSize: 120,
                    fontWeight: 500,
                    color: colors.textPrimary,
                    opacity: 0.7,
                    marginLeft: -10,
                    marginTop: 20,
                  }}
                >
                  °
                </span>
              </div>

              {/* Hero details */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: 28,
                }}
              >
                {/* Ressenti */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginRight: 80,
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    Ressenti
                  </div>
                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    {Math.round(weather.current.feelsLike)}°
                  </div>
                </div>

                {/* Vent */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    Vent
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 52,
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    {Math.round(weather.current.windSpeed)}
                    <span
                      style={{ color: colors.accent, marginLeft: 8 }}
                    >
                      {getWindArrow(weather.current.windDirection)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Decorative line */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 200,
                  height: 1,
                  background:
                    'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), transparent)',
                }}
              />
            </div>

            {/* Timeline Section */}
            <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column' }}>
              {/* Section header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 500,
                    color: colors.textDim,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginRight: 20,
                  }}
                >
                  Prévisions
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'rgba(148,163,184,0.1)',
                  }}
                />
              </div>

              {/* Timeline grid (flexbox instead of grid) */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {weather.hourly.slice(0, 3).map((hour, index) => (
                  <div
                    key={index}
                    style={{
                      flex: 1,
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 20,
                      padding: '28px 24px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      marginLeft: index > 0 ? 24 : 0,
                      position: 'relative',
                    }}
                  >
                    {/* Top accent line */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: '20%',
                        width: '60%',
                        height: 1,
                        background:
                          'linear-gradient(90deg, transparent, rgba(125,211,252,0.2), transparent)',
                      }}
                    />

                    {/* Hour */}
                    <div
                      style={{
                        fontSize: 32,
                        fontWeight: 600,
                        color: colors.textMuted,
                        marginBottom: 14,
                      }}
                    >
                      {formatHourFromISO(hour.time)}
                    </div>

                    {/* Weather icon */}
                    <div style={{ fontSize: 52, marginBottom: 14 }}>
                      {getWeatherEmoji(hour.weatherCode)}
                    </div>

                    {/* Temperature */}
                    <div
                      style={{
                        fontSize: 46,
                        fontWeight: 700,
                        color: colors.textPrimary,
                        marginBottom: 18,
                      }}
                    >
                      {Math.round(hour.temperature)}°
                    </div>

                    {/* Wind */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: 28,
                          fontWeight: 500,
                          color: '#cbd5e1',
                        }}
                      >
                        <span style={{ color: colors.accent }}>
                          {getWindArrow(hour.windDirection)}
                        </span>
                        <span style={{ marginLeft: 4 }}>
                          {Math.round(hour.windSpeed)}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 24,
                          fontWeight: 400,
                          color: colors.textDim,
                          marginTop: 8,
                        }}
                      >
                        ({Math.round(hour.windGusts)})
                      </div>
                    </div>

                    {/* Rain */}
                    <div
                      style={{
                        marginTop: 12,
                        paddingTop: 12,
                        borderTop: '1px solid rgba(148,163,184,0.08)',
                        fontSize: 24,
                        fontWeight: 500,
                        color:
                          hour.precipitation > 0
                            ? colors.accent
                            : '#475569',
                        width: '100%',
                        textAlign: 'center',
                      }}
                    >
                      {hour.precipitation.toFixed(hour.precipitation > 0 ? 1 : 0)}mm
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div
              style={{
                height: 1,
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.15) 80%, transparent 100%)',
              }}
            />

            {/* Atmosphere Section */}
            <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column' }}>
              {/* Section header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 500,
                    color: colors.textDim,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginRight: 20,
                  }}
                >
                  Atmosphère
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'rgba(148,163,184,0.1)',
                  }}
                />
              </div>

              {/* Atmosphere grid */}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {/* Pression */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 16,
                    }}
                  >
                    Pression
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 44,
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    {Math.round(weather.current.pressure)}
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 400,
                        color: colors.textMuted,
                        marginLeft: 4,
                      }}
                    >
                      hPa
                    </span>
                    <span
                      style={{
                        fontSize: 36,
                        marginLeft: 12,
                        color:
                          weather.pressureTrend === 'rising'
                            ? colors.success
                            : weather.pressureTrend === 'falling'
                              ? colors.error
                              : colors.textMuted,
                      }}
                    >
                      {getPressureTrendArrow(weather.pressureTrend)}
                    </span>
                  </div>
                </div>

                {/* Nuages */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 16,
                    }}
                  >
                    Nuages
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 44,
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    {weather.current.cloudCover}
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 400,
                        color: colors.textMuted,
                        marginLeft: 4,
                      }}
                    >
                      %
                    </span>
                  </div>
                </div>

                {/* Précip. */}
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 16,
                    }}
                  >
                    Précip.
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: 44,
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    {weather.current.precipitation.toFixed(
                      weather.current.precipitation > 0 ? 1 : 0
                    )}
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 400,
                        color: colors.textMuted,
                        marginLeft: 4,
                      }}
                    >
                      mm
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div
              style={{
                height: 1,
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.15) 80%, transparent 100%)',
              }}
            />

            {/* Solunar Section */}
            <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column' }}>
              {/* Section header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 500,
                    color: colors.textDim,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginRight: 20,
                  }}
                >
                  Solunar
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'rgba(148,163,184,0.1)',
                  }}
                />
              </div>

              {/* Solunar content */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {/* Moon visual */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginRight: 60,
                  }}
                >
                  {/* Moon circle */}
                  <div
                    style={{
                      width: 180,
                      height: 180,
                      borderRadius: '50%',
                      background: `linear-gradient(90deg, #1e293b 0%, #1e293b ${moonGradientStop}%, #e2e8f0 ${moonGradientStop}%, #e2e8f0 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow:
                        'inset -4px -4px 20px rgba(0,0,0,0.4), 0 0 40px rgba(226,232,240,0.1)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 700,
                        color: '#1e293b',
                        textShadow: '0 1px 2px rgba(255,255,255,0.3)',
                      }}
                    >
                      {moonIllumination}%
                    </span>
                  </div>

                  {/* Moon phase name */}
                  <div
                    style={{
                      marginTop: 16,
                      fontSize: 24,
                      fontWeight: 500,
                      color: colors.textMuted,
                    }}
                  >
                    {solunar.moon.phaseName}
                  </div>
                </div>

                {/* Solunar periods */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Major period */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px 0',
                      borderBottom: '1px solid rgba(148,163,184,0.08)',
                    }}
                  >
                    <span
                      style={{
                        width: 140,
                        fontSize: 22,
                        fontWeight: 500,
                        color: colors.accentWarm,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Majeure
                    </span>
                    <span
                      style={{
                        fontSize: 44,
                        fontWeight: 700,
                        color: colors.textPrimary,
                        minWidth: 160,
                        marginLeft: 24,
                      }}
                    >
                      {majorDisplay.time}
                    </span>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 400,
                        color: colors.textMuted,
                        marginLeft: 24,
                      }}
                    >
                      {majorDisplay.countdown}
                    </span>
                  </div>

                  {/* Minor period */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '20px 0',
                    }}
                  >
                    <span
                      style={{
                        width: 140,
                        fontSize: 22,
                        fontWeight: 500,
                        color: colors.textDim,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Mineure
                    </span>
                    <span
                      style={{
                        fontSize: 44,
                        fontWeight: 700,
                        color: colors.textPrimary,
                        minWidth: 160,
                        marginLeft: 24,
                      }}
                    >
                      {minorDisplay.time}
                    </span>
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 400,
                        color: colors.textMuted,
                        marginLeft: 24,
                      }}
                    >
                      {minorDisplay.countdown}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Separator */}
            <div
              style={{
                height: 1,
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.15) 20%, rgba(148,163,184,0.15) 80%, transparent 100%)',
              }}
            />

            {/* Sun times Section */}
            <div style={{ padding: '36px 0', display: 'flex', flexDirection: 'column' }}>
              {/* Section header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: 28,
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 500,
                    color: colors.textDim,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    marginRight: 20,
                  }}
                >
                  Soleil
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 1,
                    background: 'rgba(148,163,184,0.1)',
                  }}
                />
              </div>

              {/* Sun times */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                {/* Sunrise */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginRight: 120,
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      marginBottom: 16,
                      color: colors.accentWarm,
                      opacity: 0.9,
                    }}
                  >
                    ◐
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    Lever
                  </div>
                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    {formatTime(solunar.sun.rise)}
                  </div>
                </div>

                {/* Sunset */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      marginBottom: 16,
                      color: colors.accentOrange,
                      opacity: 0.9,
                    }}
                  >
                    ◑
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginBottom: 12,
                    }}
                  >
                    Coucher
                  </div>
                  <div
                    style={{
                      fontSize: 52,
                      fontWeight: 600,
                      color: colors.textSecondary,
                    }}
                  >
                    {formatTime(solunar.sun.set)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Safe zone bottom */}
          <div style={{ height: 300, display: 'flex' }} />
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
      }
    );
  } catch (error) {
    console.error('Erreur génération wallpaper:', error);
    return new Response(
      `Erreur lors de la génération: ${error instanceof Error ? error.message : 'inconnue'}`,
      { status: 500 }
    );
  }
}
