interface GuideStepProps {
  number: number;
  title: string;
  children: React.ReactNode;
}

/**
 * Composant pour une étape du guide iOS
 */
export default function GuideStep({ number, title, children }: GuideStepProps) {
  return (
    <div className="flex gap-4">
      {/* Numéro de l'étape */}
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center
                      rounded-full bg-[var(--accent)]/20 border border-[var(--accent)]/30
                      text-[var(--accent)] font-bold">
        {number}
      </div>

      {/* Contenu */}
      <div className="flex-1 pt-1">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <div className="text-gray-400 space-y-2">{children}</div>
      </div>
    </div>
  );
}
