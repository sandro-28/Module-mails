'use client'

interface DiscoverButtonProps {
  onClick: () => void
  isLoading: boolean
  discoveredCount: number
  totalCount: number
}

export default function DiscoverButton({ onClick, isLoading, discoveredCount, totalCount }: DiscoverButtonProps) {
  const allDiscovered = discoveredCount >= totalCount

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Progress indicator */}
      <div className="glass rounded-full px-4 py-1.5 flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: totalCount }).map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i < discoveredCount ? 'bg-prague-gold' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-gray-300 ml-1">
          {discoveredCount}/{totalCount}
        </span>
      </div>

      {/* Main button */}
      <button
        onClick={onClick}
        disabled={isLoading || allDiscovered}
        className={`
          discover-btn rounded-2xl px-8 py-4
          text-prague-dark font-bold text-base
          flex items-center gap-3
          disabled:opacity-50 disabled:cursor-not-allowed
          ${isLoading ? 'animate-pulse-slow' : ''}
          ${!isLoading && !allDiscovered ? 'animate-glow' : ''}
        `}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Localisation...</span>
          </>
        ) : allDiscovered ? (
          <>
            <span className="text-xl">🏆</span>
            <span>Visite complète !</span>
          </>
        ) : (
          <>
            <span className="text-xl">🔍</span>
            <span>Découvrir cet endroit</span>
          </>
        )}
      </button>

      {allDiscovered && (
        <p className="text-prague-gold text-xs animate-fade-in">
          Bravo ! Vous avez exploré tout le château !
        </p>
      )}
    </div>
  )
}
