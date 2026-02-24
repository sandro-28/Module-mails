'use client'

import { POI, getCategoryLabel, getDistance } from '@/data/prague-pois'
import { useState } from 'react'

interface POICardProps {
  poi: POI
  userPosition: { lat: number; lng: number } | null
  isVisited: boolean
  onClose: () => void
  onNavigate: () => void
}

export default function POICard({ poi, userPosition, isVisited, onClose, onNavigate }: POICardProps) {
  const [showFull, setShowFull] = useState(false)

  const distance = userPosition
    ? getDistance(userPosition.lat, userPosition.lng, poi.lat, poi.lng)
    : null

  const formatDistance = (d: number) => {
    if (d < 1000) return `${Math.round(d)} m`
    return `${(d / 1000).toFixed(1)} km`
  }

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{poi.emoji}</span>
            <h2 className="font-display text-xl font-bold text-white leading-tight">
              {poi.name}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`badge-${poi.category} text-xs px-2 py-0.5 rounded-full font-medium`}>
              {getCategoryLabel(poi.category)}
            </span>
            {poi.yearBuilt && (
              <span className="text-xs text-gray-400">
                📅 {poi.yearBuilt}
              </span>
            )}
            {distance !== null && (
              <span className="text-xs text-blue-300">
                📍 {formatDistance(distance)}
              </span>
            )}
            {isVisited && (
              <span className="text-xs text-green-400 font-medium">
                ✓ Visité
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors p-1 -mt-1 -mr-1"
          aria-label="Fermer"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Description */}
      <div className="mb-4">
        <p className="text-gray-300 text-sm leading-relaxed">
          {showFull ? poi.fullDescription : poi.shortDescription}
        </p>
        {!showFull && (
          <button
            onClick={() => setShowFull(true)}
            className="text-prague-gold text-sm font-medium mt-2 hover:underline"
          >
            Lire la description complète →
          </button>
        )}
      </div>

      {/* Fun Fact */}
      {showFull && (
        <div className="glass-light rounded-xl p-3 mb-4 animate-fade-in">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-xs font-semibold text-prague-gold mb-1">Le saviez-vous ?</p>
              <p className="text-xs text-gray-300 leading-relaxed">{poi.funFact}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tip */}
      {showFull && poi.tip && (
        <div className="glass-light rounded-xl p-3 mb-4 animate-fade-in">
          <div className="flex items-start gap-2">
            <span className="text-lg">🎯</span>
            <div>
              <p className="text-xs font-semibold text-green-400 mb-1">Conseil</p>
              <p className="text-xs text-gray-300 leading-relaxed">{poi.tip}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={onNavigate}
        className="w-full py-3 rounded-xl font-semibold text-sm transition-all
          bg-gradient-to-r from-prague-accent to-prague-blue text-white
          hover:from-prague-blue hover:to-prague-accent
          active:scale-[0.98]"
      >
        🧭 Ouvrir dans Google Maps
      </button>
    </div>
  )
}
