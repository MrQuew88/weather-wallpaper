'use client';

import { useState } from 'react';

interface UrlGeneratorProps {
  url: string;
}

/**
 * Composant affichant l'URL générée avec bouton de copie
 */
export default function UrlGenerator({ url }: UrlGeneratorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erreur copie:', error);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wider">
        Votre lien personnalisé
      </label>

      <div className="flex gap-2">
        {/* URL affichée */}
        <div className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg
                        text-[var(--accent)] text-sm font-mono
                        overflow-x-auto whitespace-nowrap scrollbar-thin">
          {url}
        </div>

        {/* Bouton copier */}
        <button
          onClick={handleCopy}
          className={`px-4 py-3 rounded-lg font-medium transition-all
                     ${copied
                       ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                       : 'bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/30 hover:bg-[var(--accent)]/30'
                     }`}
        >
          {copied ? (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copié
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copier
            </span>
          )}
        </button>
      </div>

      {/* Aperçu du lien */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 mt-3 text-sm text-gray-400 hover:text-[var(--accent)] transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        Voir l&apos;aperçu
      </a>
    </div>
  );
}
