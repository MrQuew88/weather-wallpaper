/**
 * Route API pour la génération du fond d'écran météo
 * Conversion directe du HTML Figma vers JSX Satori
 * Ratio d'échelle: 330×716px → 1290×2796px (×3.9)
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

export const runtime = 'edge';

// Dimensions (iPhone 15 Pro Max)
const WIDTH = 1290;
const HEIGHT = 2796;

// Safe zones en pourcentage
const SAFE_ZONE_TOP = Math.round(HEIGHT * 0.25);   // 25% = 699px
const SAFE_ZONE_BOTTOM = Math.round(HEIGHT * 0.07); // 7% = 196px

// Ratio d'échelle (330px → 1290px)
const SCALE = 3.9;

// Helpers pour conversion
const px = (value: number) => Math.round(value * SCALE);

// Couleurs
const colors = {
  textPrimary: '#fcfcfc',
  textSecondary: '#d0d0d0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
  textWhite: '#ffffff',
  textLight: '#e2e8f0',
  textWind: '#cbd5e1',
  accentBlue: '#7dd3fc',
  accentYellow: '#fbbf24',
  accentOrange: '#f97316',
  accentGreen: '#34d399',
  cardBg: 'rgba(255, 255, 255, 0.02)',
  cardBorder: 'rgba(255, 255, 255, 0.04)',
  divider: 'rgba(148, 163, 184, 0.1)',
  dividerLight: 'rgba(148, 163, 184, 0.08)',
  moonDark: '#1e293b',
  moonLight: '#e2e8f0',
};

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

    const weather = await getWeatherData(lat, lon);
    const solunar = getSolunarData(lat, lon, new Date());
    const now = new Date();

    const nextMajor = getNextPeriod(solunar.major, now);
    const nextMinor = getNextPeriod(solunar.minor, now);
    const majorDisplay = formatSolunarPeriod(nextMajor?.period || null, now, nextMajor?.status || null);
    const minorDisplay = formatSolunarPeriod(nextMinor?.period || null, now, nextMinor?.status || null);

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
            background: 'linear-gradient(180deg, rgb(13, 27, 42) 0%, rgb(10, 22, 40) 30%, rgb(15, 29, 47) 70%, rgb(13, 25, 38) 100%)',
          }}
        >
          {/* Safe zone top - 25% */}
          <div style={{ height: SAFE_ZONE_TOP, display: 'flex', flexShrink: 0 }} />

          {/* Content */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: `0 ${px(20)}px`,
              gap: px(20),
            }}
          >
            {/* Location */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: px(2) }}>
              <span
                style={{
                  fontSize: px(16),
                  fontWeight: 800,
                  color: colors.textPrimary,
                  textTransform: 'uppercase',
                  letterSpacing: px(0.24),
                }}
              >
                {name}
              </span>
              {region && (
                <span
                  style={{
                    fontSize: px(12),
                    fontWeight: 400,
                    color: colors.textSecondary,
                    letterSpacing: px(0.39),
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
                  gap: px(6),
                  marginBottom: px(12),
                }}
              >
                <span
                  style={{
                    fontSize: px(14),
                    fontWeight: 800,
                    color: colors.textPrimary,
                    textTransform: 'uppercase',
                    letterSpacing: px(1.1),
                  }}
                >
                  Prévisions
                </span>
                <div style={{ flex: 1, height: 1, background: colors.divider, display: 'flex' }} />
              </div>

              {/* Forecast cards */}
              <div style={{ display: 'flex', gap: px(7), justifyContent: 'center' }}>
                {weather.hourly.slice(0, 3).map((hour, index) => (
                  <div
                    key={index}
                    style={{
                      width: px(92),
                      background: colors.cardBg,
                      border: `1px solid ${colors.cardBorder}`,
                      borderRadius: px(20),
                      padding: `${px(8)}px ${px(7)}px`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: px(4),
                      alignItems: 'center',
                    }}
                  >
                    {/* Time */}
                    <span style={{ fontSize: px(12), fontWeight: 700, color: colors.textMuted }}>
                      {formatHourFromISO(hour.time)}
                    </span>

                    {/* Icon */}
                    <span style={{ fontSize: px(15) }}>
                      {getWeatherEmoji(hour.weatherCode)}
                    </span>

                    {/* Temp */}
                    <span style={{ fontSize: px(14), fontWeight: 800, color: colors.textWhite }}>
                      {Math.round(hour.temperature)}°
                    </span>

                    {/* Wind direction */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: px(2), fontSize: px(12) }}>
                      <span style={{ color: colors.accentBlue }}>{getWindArrow(hour.windDirection)}</span>
                      <span style={{ color: colors.textWind, fontWeight: 700 }}>{Math.round(hour.windSpeed)}</span>
                    </div>

                    {/* Wind gust */}
                    <span style={{ fontSize: px(10), fontWeight: 400, color: colors.textSecondary }}>
                      ({Math.round(hour.windGusts)})
                    </span>

                    {/* Precip */}
                    <div
                      style={{
                        display: 'flex',
                        width: '100%',
                        paddingTop: px(3),
                        borderTop: `1px solid ${colors.dividerLight}`,
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: px(12),
                          fontWeight: 500,
                          color: hour.precipitation > 0 ? colors.accentBlue : colors.textMuted,
                        }}
                      >
                        {hour.precipitation > 0 ? `${hour.precipitation.toFixed(1)}mm` : '0mm'}
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
                  gap: px(6),
                  marginBottom: px(12),
                }}
              >
                <span
                  style={{
                    fontSize: px(14),
                    fontWeight: 800,
                    color: colors.textPrimary,
                    textTransform: 'uppercase',
                    letterSpacing: px(1.1),
                  }}
                >
                  Atmosphère
                </span>
                <div style={{ flex: 1, height: 1, background: colors.divider, display: 'flex' }} />
              </div>

              {/* Grid */}
              <div style={{ display: 'flex', gap: px(11), justifyContent: 'center' }}>
                {/* Pression */}
                <div
                  style={{
                    width: px(90),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: px(4),
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: px(10),
                      fontWeight: 400,
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: px(0.5),
                    }}
                  >
                    Pression
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: px(12), fontWeight: 800, color: colors.textPrimary }}>
                      {Math.round(weather.current.pressure)}
                    </span>
                    <span style={{ fontSize: px(8), fontWeight: 400, color: colors.textMuted, marginLeft: 2 }}>
                      hPa
                    </span>
                    <span style={{ fontSize: px(10), fontWeight: 700, color: colors.accentGreen, marginLeft: 4 }}>
                      {getPressureTrendArrow(weather.pressureTrend)}
                    </span>
                  </div>
                </div>

                {/* Nuages */}
                <div
                  style={{
                    width: px(90),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: px(4),
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: px(10),
                      fontWeight: 400,
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: px(0.5),
                    }}
                  >
                    Nuages
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: px(12), fontWeight: 800, color: colors.textPrimary }}>
                      {weather.current.cloudCover}
                    </span>
                    <span style={{ fontSize: px(8), fontWeight: 400, color: colors.textMuted, marginLeft: 2 }}>
                      %
                    </span>
                  </div>
                </div>

                {/* Précip */}
                <div
                  style={{
                    width: px(90),
                    display: 'flex',
                    flexDirection: 'column',
                    gap: px(4),
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      fontSize: px(10),
                      fontWeight: 400,
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: px(0.5),
                    }}
                  >
                    Précip.
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ fontSize: px(12), fontWeight: 800, color: colors.textPrimary }}>
                      {weather.current.precipitation > 0 ? weather.current.precipitation.toFixed(1) : '0'}
                    </span>
                    <span style={{ fontSize: px(8), fontWeight: 400, color: colors.textMuted, marginLeft: 2 }}>
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
                  gap: px(6),
                  marginBottom: px(12),
                }}
              >
                <span
                  style={{
                    fontSize: px(14),
                    fontWeight: 800,
                    color: colors.textPrimary,
                    textTransform: 'uppercase',
                    letterSpacing: px(1.1),
                  }}
                >
                  Solunar
                </span>
                <div style={{ flex: 1, height: 1, background: colors.divider, display: 'flex' }} />
              </div>

              {/* Content */}
              <div style={{ display: 'flex', gap: px(16), alignItems: 'center', justifyContent: 'center' }}>
                {/* Moon */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div
                    style={{
                      width: px(50),
                      height: px(50),
                      borderRadius: '50%',
                      background: `linear-gradient(90deg, ${colors.moonDark} 0%, ${colors.moonDark} ${moonGradientStop}%, ${colors.moonLight} ${moonGradientStop}%, ${colors.moonLight} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span style={{ fontSize: px(10), fontWeight: 700, color: colors.moonDark }}>
                      {moonIllumination}%
                    </span>
                  </div>
                  <span style={{ marginTop: px(4), fontSize: px(7), fontWeight: 500, color: colors.textMuted }}>
                    {solunar.moon.phaseName}
                  </span>
                </div>

                {/* Periods */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {/* Major */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: px(7),
                      padding: `${px(6)}px 0`,
                      borderBottom: `1px solid ${colors.dividerLight}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: px(10),
                        fontWeight: 500,
                        color: colors.accentYellow,
                        textTransform: 'uppercase',
                        letterSpacing: px(0.5),
                      }}
                    >
                      Majeure
                    </span>
                    <span style={{ fontSize: px(14), fontWeight: 800, color: colors.textWhite }}>
                      {majorDisplay.time}
                    </span>
                    <span style={{ fontSize: px(10), fontWeight: 400, color: colors.textMuted }}>
                      {majorDisplay.countdown}
                    </span>
                  </div>

                  {/* Minor */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: px(7),
                      padding: `${px(6)}px 0`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: px(10),
                        fontWeight: 500,
                        color: colors.textDim,
                        textTransform: 'uppercase',
                        letterSpacing: px(0.5),
                      }}
                    >
                      Mineure
                    </span>
                    <span style={{ fontSize: px(14), fontWeight: 800, color: colors.textWhite }}>
                      {minorDisplay.time}
                    </span>
                    <span style={{ fontSize: px(10), fontWeight: 400, color: colors.textMuted }}>
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
                  gap: px(6),
                  marginBottom: px(12),
                }}
              >
                <span
                  style={{
                    fontSize: px(14),
                    fontWeight: 800,
                    color: colors.textPrimary,
                    textTransform: 'uppercase',
                    letterSpacing: px(1.1),
                  }}
                >
                  Soleil
                </span>
                <div style={{ flex: 1, height: 1, background: colors.divider, display: 'flex' }} />
              </div>

              {/* Sun times */}
              <div style={{ display: 'flex', gap: px(34), justifyContent: 'center' }}>
                {/* Sunrise */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: px(4), alignItems: 'center' }}>
                  <span style={{ fontSize: px(13), color: colors.accentYellow }}>◐</span>
                  <span
                    style={{
                      fontSize: px(10),
                      fontWeight: 400,
                      color: colors.textDim,
                      textTransform: 'uppercase',
                    }}
                  >
                    Lever
                  </span>
                  <span style={{ fontSize: px(14), fontWeight: 700, color: colors.textLight }}>
                    {formatTime(solunar.sun.rise)}
                  </span>
                </div>

                {/* Sunset */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: px(4), alignItems: 'center' }}>
                  <span style={{ fontSize: px(13), color: colors.accentOrange }}>◑</span>
                  <span
                    style={{
                      fontSize: px(10),
                      fontWeight: 400,
                      color: colors.textDim,
                      textTransform: 'uppercase',
                    }}
                  >
                    Coucher
                  </span>
                  <span style={{ fontSize: px(14), fontWeight: 700, color: colors.textLight }}>
                    {formatTime(solunar.sun.set)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Safe zone bottom - 7% */}
          <div style={{ height: SAFE_ZONE_BOTTOM, display: 'flex', flexShrink: 0 }} />
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        fonts: [
          { name: 'JetBrains Mono', data: fontRegular, style: 'normal', weight: 400 },
          { name: 'JetBrains Mono', data: fontMedium, style: 'normal', weight: 500 },
          { name: 'JetBrains Mono', data: fontBold, style: 'normal', weight: 700 },
          { name: 'JetBrains Mono', data: fontExtraBold, style: 'normal', weight: 800 },
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
