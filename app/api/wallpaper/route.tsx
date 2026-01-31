/**
 * Route API pour la génération du fond d'écran météo
 * Design basé sur le fichier Figma corrected-design.html
 * Échelle: 330×716px → 1179×2556px (×3.57)
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
} from '../../../lib/helpers';

// Configuration edge runtime pour meilleures performances
export const runtime = 'edge';

// Dimensions du wallpaper (iPhone 16 Pro Max - plus haute résolution)
const WIDTH = 1320;
const HEIGHT = 2868;

// Safe zones en pourcentage (universel pour tous les iPhones)
const SAFE_ZONE_TOP_PERCENT = 0.20;    // 20% du haut (date + horloge iOS)
const SAFE_ZONE_BOTTOM_PERCENT = 0.13; // 13% du bas (dock + home indicator)

// Calcul en pixels
const safeZoneTop = Math.round(HEIGHT * SAFE_ZONE_TOP_PERCENT);      // ~574px
const safeZoneBottom = Math.round(HEIGHT * SAFE_ZONE_BOTTOM_PERCENT); // ~373px
const contentHeight = HEIGHT - safeZoneTop - safeZoneBottom;          // ~1921px

// Layout
const CONTENT_PADDING_X = 80;

// Couleurs du design
const colors = {
  // Background
  bgGradient: 'linear-gradient(180deg, #0d1b2a 0%, #0a1628 30%, #0f1d2f 70%, #0d1926 100%)',

  // Texte
  textPrimary: '#fcfcfc',
  textSecondary: '#d0d0d0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  textWhite: '#ffffff',
  textLight: '#e2e8f0',
  textWindValue: '#cbd5e1',

  // Accents
  accentBlue: '#7dd3fc',
  accentYellow: '#fbbf24',
  accentOrange: '#f97316',
  accentGreen: '#34d399',

  // Cartes & séparateurs
  cardBg: 'rgba(255, 255, 255, 0.02)',
  cardBorder: 'rgba(255, 255, 255, 0.04)',
  divider: 'rgba(148, 163, 184, 0.1)',
  dividerLight: 'rgba(148, 163, 184, 0.08)',

  // Lune
  moonDark: '#1e293b',
  moonLight: '#e2e8f0',
};

/**
 * Gestionnaire GET pour générer le fond d'écran
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const lat = parseFloat(searchParams.get('lat') || '0');
  const lon = parseFloat(searchParams.get('lon') || '0');
  const name = searchParams.get('name') || 'Position';
  const region = searchParams.get('region') || '';

  if (lat === 0 && lon === 0) {
    return new Response('Paramètres lat et lon requis', { status: 400 });
  }

  try {
    const baseUrl = new URL(request.url).origin;

    // Charger les fonts
    const [fontRegular, fontMedium, fontBold, fontExtraBold] = await Promise.all([
      fetch(`${baseUrl}/fonts/JetBrainsMono-Regular.ttf`).then((res) => {
        if (!res.ok) throw new Error(`Font Regular: ${res.status}`);
        return res.arrayBuffer();
      }),
      fetch(`${baseUrl}/fonts/JetBrainsMono-Medium.ttf`).then((res) => {
        if (!res.ok) throw new Error(`Font Medium: ${res.status}`);
        return res.arrayBuffer();
      }),
      fetch(`${baseUrl}/fonts/JetBrainsMono-Bold.ttf`).then((res) => {
        if (!res.ok) throw new Error(`Font Bold: ${res.status}`);
        return res.arrayBuffer();
      }),
      fetch(`${baseUrl}/fonts/JetBrainsMono-ExtraBold.ttf`).then((res) => {
        if (!res.ok) throw new Error(`Font ExtraBold: ${res.status}`);
        return res.arrayBuffer();
      }),
    ]);

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

    // Calcul du gradient lunaire (illumination)
    const moonIllumination = solunar.moon.illumination;
    const moonGradientStop = 100 - moonIllumination;

    return new ImageResponse(
      (
        <div
          style={{
            width: WIDTH,
            height: HEIGHT,
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'JetBrains Mono',
            background: colors.bgGradient,
          }}
        >
          {/* Safe zone top - 20% */}
          <div style={{ height: safeZoneTop, flexShrink: 0, display: 'flex' }} />

          {/* Contenu principal - 67% */}
          <div
            style={{
              height: contentHeight,
              display: 'flex',
              flexDirection: 'column',
              padding: `0 ${CONTENT_PADDING_X}px`,
              justifyContent: 'space-between',
            }}
          >
            {/* Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <span
                style={{
                  fontSize: 57,
                  fontWeight: 800,
                  color: colors.textPrimary,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                {name}
              </span>
              {region && (
                <span
                  style={{
                    fontSize: 43,
                    fontWeight: 400,
                    color: colors.textSecondary,
                    letterSpacing: 1.4,
                  }}
                >
                  {region}
                </span>
              )}
            </div>

            {/* Section Prévisions */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 21,
                  marginBottom: 43,
                }}
              >
                <span
                  style={{
                    fontSize: 50,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  Prévisions
                </span>
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: 1,
                    background: colors.divider,
                  }}
                />
              </div>

              {/* Cartes prévisions */}
              <div style={{ display: 'flex', gap: 25, justifyContent: 'center' }}>
                {weather.hourly.slice(0, 3).map((hour, index) => (
                  <div
                    key={index}
                    style={{
                      width: 328,
                      background: colors.cardBg,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: 71,
                      padding: '28px 25px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    {/* Heure */}
                    <span
                      style={{
                        fontSize: 43,
                        fontWeight: 700,
                        color: colors.textMuted,
                      }}
                    >
                      {formatHourFromISO(hour.time)}
                    </span>

                    {/* Icône météo */}
                    <span style={{ fontSize: 54 }}>
                      {getWeatherEmoji(hour.weatherCode)}
                    </span>

                    {/* Température */}
                    <span
                      style={{
                        fontSize: 50,
                        fontWeight: 800,
                        color: colors.textWhite,
                      }}
                    >
                      {Math.round(hour.temperature)}°
                    </span>

                    {/* Vent */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 7,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 43,
                            color: colors.accentBlue,
                          }}
                        >
                          {getWindArrow(hour.windDirection)}
                        </span>
                        <span
                          style={{
                            fontSize: 43,
                            fontWeight: 700,
                            color: colors.textWindValue,
                          }}
                        >
                          {Math.round(hour.windSpeed)}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: 36,
                          fontWeight: 400,
                          color: colors.textSecondary,
                        }}
                      >
                        ({Math.round(hour.windGusts)})
                      </span>
                    </div>

                    {/* Précipitations */}
                    <div
                      style={{
                        display: 'flex',
                        width: '100%',
                        paddingTop: 11,
                        borderTop: `1px solid ${colors.dividerLight}`,
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 43,
                          fontWeight: 500,
                          color:
                            hour.precipitation > 0
                              ? colors.accentBlue
                              : colors.textMuted,
                        }}
                      >
                        {hour.precipitation > 0
                          ? `${hour.precipitation.toFixed(1)}mm`
                          : '0mm'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Atmosphère */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 21,
                  marginBottom: 43,
                }}
              >
                <span
                  style={{
                    fontSize: 50,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  Atmosphère
                </span>
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: 1,
                    background: colors.divider,
                  }}
                />
              </div>

              {/* Grille atmosphère */}
              <div style={{ display: 'flex', gap: 40, justifyContent: 'center' }}>
                {/* Pression */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    width: 320,
                  }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 400,
                      color: colors.textSecondary,
                      letterSpacing: 1.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    Pression
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span
                      style={{
                        fontSize: 43,
                        fontWeight: 800,
                        color: colors.textPrimary,
                      }}
                    >
                      {Math.round(weather.current.pressure)}
                    </span>
                    <span
                      style={{
                        fontSize: 29,
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
                        fontWeight: 700,
                        color: colors.accentGreen,
                        marginLeft: 8,
                      }}
                    >
                      {getPressureTrendArrow(weather.pressureTrend)}
                    </span>
                  </div>
                </div>

                {/* Nuages */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    width: 320,
                  }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 400,
                      color: colors.textSecondary,
                      letterSpacing: 1.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    Nuages
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span
                      style={{
                        fontSize: 43,
                        fontWeight: 800,
                        color: colors.textPrimary,
                      }}
                    >
                      {weather.current.cloudCover}
                    </span>
                    <span
                      style={{
                        fontSize: 29,
                        fontWeight: 400,
                        color: colors.textMuted,
                        marginLeft: 4,
                      }}
                    >
                      %
                    </span>
                  </div>
                </div>

                {/* Précipitations */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 16,
                    width: 320,
                  }}
                >
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 400,
                      color: colors.textSecondary,
                      letterSpacing: 1.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    Précip.
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span
                      style={{
                        fontSize: 43,
                        fontWeight: 800,
                        color: colors.textPrimary,
                      }}
                    >
                      {weather.current.precipitation > 0
                        ? weather.current.precipitation.toFixed(1)
                        : '0'}
                    </span>
                    <span
                      style={{
                        fontSize: 29,
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

            {/* Section Solunar */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 21,
                  marginBottom: 43,
                }}
              >
                <span
                  style={{
                    fontSize: 50,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  Solunar
                </span>
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: 1,
                    background: colors.divider,
                  }}
                />
              </div>

              {/* Contenu Solunar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 57,
                }}
              >
                {/* Lune */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 178,
                      height: 178,
                      borderRadius: '50%',
                      background: `linear-gradient(90deg, ${colors.moonDark} 0%, ${colors.moonDark} ${moonGradientStop}%, ${colors.moonLight} ${moonGradientStop}%, ${colors.moonLight} 100%)`,
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
                        color: colors.moonDark,
                        textShadow: '0 1px 2px rgba(255,255,255,0.3)',
                      }}
                    >
                      {moonIllumination}%
                    </span>
                  </div>
                  <span
                    style={{
                      marginTop: 14,
                      fontSize: 25,
                      fontWeight: 500,
                      color: colors.textMuted,
                    }}
                  >
                    {solunar.moon.phaseName}
                  </span>
                </div>

                {/* Périodes */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Majeure */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 25,
                      paddingBottom: 21,
                      borderBottom: `1px solid ${colors.dividerLight}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 500,
                        color: colors.accentYellow,
                        letterSpacing: 1.8,
                        textTransform: 'uppercase',
                      }}
                    >
                      Majeure
                    </span>
                    <span
                      style={{
                        fontSize: 50,
                        fontWeight: 800,
                        color: colors.textWhite,
                        minWidth: 160,
                      }}
                    >
                      {majorDisplay.time}
                    </span>
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 400,
                        color: colors.textMuted,
                      }}
                    >
                      {majorDisplay.countdown}
                    </span>
                  </div>

                  {/* Mineure */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 25,
                      paddingTop: 21,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 500,
                        color: colors.textDim,
                        letterSpacing: 1.8,
                        textTransform: 'uppercase',
                      }}
                    >
                      Mineure
                    </span>
                    <span
                      style={{
                        fontSize: 50,
                        fontWeight: 800,
                        color: colors.textWhite,
                        minWidth: 160,
                      }}
                    >
                      {minorDisplay.time}
                    </span>
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 400,
                        color: colors.textMuted,
                      }}
                    >
                      {minorDisplay.countdown}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section Soleil */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 21,
                  marginBottom: 43,
                }}
              >
                <span
                  style={{
                    fontSize: 50,
                    fontWeight: 800,
                    color: colors.textPrimary,
                    letterSpacing: 4,
                    textTransform: 'uppercase',
                  }}
                >
                  Soleil
                </span>
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    height: 1,
                    background: colors.divider,
                  }}
                />
              </div>

              {/* Lever / Coucher */}
              <div
                style={{
                  display: 'flex',
                  gap: 120,
                  justifyContent: 'center',
                }}
              >
                {/* Lever */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 46,
                      color: colors.accentYellow,
                      opacity: 0.9,
                    }}
                  >
                    ◐
                  </span>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: 1.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    Lever
                  </span>
                  <span
                    style={{
                      fontSize: 50,
                      fontWeight: 700,
                      color: colors.textLight,
                    }}
                  >
                    {formatTime(solunar.sun.rise)}
                  </span>
                </div>

                {/* Coucher */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 14,
                  }}
                >
                  <span
                    style={{
                      fontSize: 46,
                      color: colors.accentOrange,
                      opacity: 0.9,
                    }}
                  >
                    ◑
                  </span>
                  <span
                    style={{
                      fontSize: 36,
                      fontWeight: 400,
                      color: colors.textDim,
                      letterSpacing: 1.8,
                      textTransform: 'uppercase',
                    }}
                  >
                    Coucher
                  </span>
                  <span
                    style={{
                      fontSize: 50,
                      fontWeight: 700,
                      color: colors.textLight,
                    }}
                  >
                    {formatTime(solunar.sun.set)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Safe zone bottom - 13% */}
          <div style={{ height: safeZoneBottom, flexShrink: 0, display: 'flex' }} />
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
          {
            name: 'JetBrains Mono',
            data: fontRegular,
            style: 'normal',
            weight: 400,
          },
          {
            name: 'JetBrains Mono',
            data: fontMedium,
            style: 'normal',
            weight: 500,
          },
          {
            name: 'JetBrains Mono',
            data: fontBold,
            style: 'normal',
            weight: 700,
          },
          {
            name: 'JetBrains Mono',
            data: fontExtraBold,
            style: 'normal',
            weight: 800,
          },
        ],
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
