'use client';

import { useState } from 'react';

interface WallpaperPreviewProps {
  url?: string;
}

/**
 * Composant d'aperçu du wallpaper avec mockup iPhone
 */
export default function WallpaperPreview({ url }: WallpaperPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // URL par défaut pour la démo (Lac du Der)
  const previewUrl = url || '/api/wallpaper?lat=48.56&lon=4.75&name=Lac%20du%20Der&region=Champagne';

  return (
    <div className="relative">
      {/* Mockup iPhone */}
      <div className="relative mx-auto w-[280px] h-[570px] bg-black rounded-[40px] p-2
                      shadow-2xl shadow-black/50 border border-gray-800">
        {/* Encoche */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-10" />

        {/* Écran */}
        <div className="relative w-full h-full bg-[#0d1b2a] rounded-[32px] overflow-hidden">
          {/* Image du wallpaper */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {hasError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Aperçu non disponible</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Aperçu du wallpaper météo"
              className={`w-full h-full object-cover transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}

          {/* Overlay horloge simulée */}
          <div className="absolute top-12 left-0 right-0 text-center pointer-events-none">
            <div className="text-white/80 text-5xl font-light tracking-tight">
              {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-white/60 text-lg mt-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </div>
      </div>

      {/* Label */}
      <div className="text-center mt-4 text-sm text-gray-500">
        Aperçu sur écran de verrouillage
      </div>
    </div>
  );
}
