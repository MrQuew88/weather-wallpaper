'use client';

import { useState } from 'react';
import LocationSearch from '../components/LocationSearch';
import UrlGenerator from '../components/UrlGenerator';
import GuideStep from '../components/GuideStep';
import WallpaperPreview from '../components/WallpaperPreview';

/**
 * Type pour un lieu sélectionné
 */
interface SelectedLocation {
  name: string;
  latitude: number;
  longitude: number;
  region?: string;
}

/**
 * Page d'accueil - Landing page Weather Wallpaper
 */
export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);

  // Génération de l'URL personnalisée
  const generateUrl = (location: SelectedLocation) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({
      lat: location.latitude.toFixed(4),
      lon: location.longitude.toFixed(4),
      name: location.name,
    });
    if (location.region) {
      params.set('region', location.region);
    }
    return `${baseUrl}/api/wallpaper?${params.toString()}`;
  };

  // Handler pour la sélection de lieu
  const handleLocationSelect = (location: {
    name: string;
    latitude: number;
    longitude: number;
    admin1?: string;
    country: string;
  }) => {
    setSelectedLocation({
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      region: location.admin1 || location.country,
    });
  };

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="py-6 px-4 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🌤️</div>
            <div>
              <h1 className="text-xl font-bold text-white">Weather Wallpaper</h1>
              <p className="text-sm text-gray-500">Fond d&apos;écran météo pour pêcheurs</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Texte */}
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
                La météo sur votre{' '}
                <span className="text-[var(--accent)]">écran de verrouillage</span>
              </h2>
              <p className="text-lg text-gray-400 mb-8">
                Un fond d&apos;écran dynamique qui affiche les conditions météo actuelles,
                les prévisions horaires et les données solunaires pour optimiser
                vos sorties pêche.
              </p>

              {/* Features */}
              <div className="space-y-4">
                {[
                  { icon: '🌡️', text: 'Température et ressenti en temps réel' },
                  { icon: '💨', text: 'Vent, direction et rafales' },
                  { icon: '🌙', text: 'Phases lunaires et périodes solunaires' },
                  { icon: '🔄', text: 'Mise à jour automatique via Raccourcis iOS' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-gray-300">
                    <span className="text-xl">{feature.icon}</span>
                    <span>{feature.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Aperçu */}
            <div className="flex justify-center">
              <WallpaperPreview
                url={selectedLocation ? generateUrl(selectedLocation) : undefined}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Configurateur */}
      <section id="configurateur" className="py-16 px-4 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-4">
              Configurez votre wallpaper
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Recherchez votre lieu de pêche pour générer un lien personnalisé
              que vous utiliserez dans le raccourci iOS.
            </p>
          </div>

          <div className="flex flex-col items-center gap-8">
            {/* Recherche de lieu */}
            <LocationSearch onLocationSelect={handleLocationSelect} />

            {/* Lieu sélectionné */}
            {selectedLocation && (
              <div className="w-full max-w-md p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📍</span>
                  <div>
                    <div className="font-medium text-white">{selectedLocation.name}</div>
                    {selectedLocation.region && (
                      <div className="text-sm text-gray-400">{selectedLocation.region}</div>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* URL générée */}
            {selectedLocation && (
              <UrlGenerator url={generateUrl(selectedLocation)} />
            )}
          </div>
        </div>
      </section>

      {/* Guide iOS */}
      <section id="guide" className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Guide d&apos;installation iOS
            </h2>
            <p className="text-gray-400">
              Configurez votre iPhone pour mettre à jour automatiquement
              le fond d&apos;écran toutes les 2 heures.
            </p>
          </div>

          {/* Partie 1: Créer le raccourci */}
          <div className="mb-12">
            <h3 className="text-xl font-semibold text-[var(--accent)] mb-6 flex items-center gap-2">
              <span className="px-3 py-1 bg-[var(--accent)]/20 rounded-full text-sm">
                Partie 1
              </span>
              Créer le raccourci
            </h3>

            <div className="space-y-6 ml-2 border-l-2 border-white/10 pl-6">
              <GuideStep number={1} title="Ouvrir l'app Raccourcis">
                <p>
                  Sur votre iPhone, ouvrez l&apos;application <strong>Raccourcis</strong>.
                  Si vous ne l&apos;avez pas, téléchargez-la depuis l&apos;App Store.
                </p>
              </GuideStep>

              <GuideStep number={2} title="Créer un nouveau raccourci">
                <p>
                  Appuyez sur le bouton <strong>+</strong> en haut à droite
                  pour créer un nouveau raccourci.
                </p>
              </GuideStep>

              <GuideStep number={3} title="Ajouter l'action 'Obtenir le contenu de l'URL'">
                <p>
                  Appuyez sur <strong>Ajouter une action</strong>, recherchez
                  &quot;URL&quot; et sélectionnez <strong>Obtenir le contenu de l&apos;URL</strong>.
                </p>
                <p className="mt-2">
                  Collez votre lien personnalisé généré ci-dessus dans le champ URL.
                </p>
              </GuideStep>

              <GuideStep number={4} title="Ajouter 'Définir le fond d'écran'">
                <p>
                  Ajoutez une seconde action : recherchez &quot;fond d&apos;écran&quot;
                  et sélectionnez <strong>Définir le fond d&apos;écran</strong>.
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Choisissez <strong>Écran verrouillé</strong> (ou &quot;Les deux&quot;)</li>
                  <li>• Désactivez <strong>Afficher l&apos;aperçu</strong></li>
                </ul>
              </GuideStep>

              <GuideStep number={5} title="Nommer et enregistrer">
                <p>
                  Appuyez sur le nom en haut et renommez le raccourci en
                  <strong> &quot;Météo Wallpaper&quot;</strong>, puis appuyez sur <strong>OK</strong>.
                </p>
              </GuideStep>
            </div>
          </div>

          {/* Partie 2: Automatiser */}
          <div>
            <h3 className="text-xl font-semibold text-[var(--accent-warm)] mb-6 flex items-center gap-2">
              <span className="px-3 py-1 bg-[var(--accent-warm)]/20 rounded-full text-sm">
                Partie 2
              </span>
              Automatiser les mises à jour
            </h3>

            <div className="space-y-6 ml-2 border-l-2 border-white/10 pl-6">
              <GuideStep number={1} title="Aller dans Automatisation">
                <p>
                  Dans l&apos;app Raccourcis, appuyez sur l&apos;onglet
                  <strong> Automatisation</strong> en bas de l&apos;écran.
                </p>
              </GuideStep>

              <GuideStep number={2} title="Créer une automatisation personnelle">
                <p>
                  Appuyez sur <strong>+</strong> puis <strong>Créer une automatisation personnelle</strong>.
                </p>
              </GuideStep>

              <GuideStep number={3} title="Choisir le déclencheur 'Heure de la journée'">
                <p>
                  Sélectionnez <strong>Heure de la journée</strong>.
                </p>
                <ul className="mt-2 space-y-1 text-sm">
                  <li>• Configurez l&apos;heure de début (ex: 6h00)</li>
                  <li>• Activez <strong>Répéter</strong> → <strong>Toutes les 2 heures</strong></li>
                  <li>• Le wallpaper se mettra à jour automatiquement avec les nouvelles conditions</li>
                </ul>
              </GuideStep>

              <GuideStep number={4} title="Sélectionner le raccourci">
                <p>
                  Appuyez sur <strong>Suivant</strong>, puis <strong>Exécuter le raccourci</strong>.
                  Choisissez <strong>&quot;Météo Wallpaper&quot;</strong>.
                </p>
              </GuideStep>

              <GuideStep number={5} title="Désactiver la confirmation">
                <p>
                  <strong>Important :</strong> Désactivez <strong>&quot;Demander avant d&apos;exécuter&quot;</strong>
                  pour que la mise à jour soit silencieuse.
                </p>
              </GuideStep>
            </div>
          </div>

          {/* Note */}
          <div className="mt-10 p-4 bg-[var(--accent)]/10 border border-[var(--accent)]/20 rounded-lg">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div className="text-sm text-gray-300">
                <strong className="text-white">Astuce :</strong> Vous pouvez également
                exécuter le raccourci manuellement à tout moment depuis l&apos;app Raccourcis
                ou en ajoutant un widget sur votre écran d&apos;accueil.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-5xl mx-auto text-center text-gray-500 text-sm">
          <p className="mb-2">
            Weather Wallpaper — Données météo via{' '}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              Open-Meteo
            </a>
          </p>
          <p>
            Fait avec ❤️ pour les passionnés de pêche
          </p>
        </div>
      </footer>
    </main>
  );
}
