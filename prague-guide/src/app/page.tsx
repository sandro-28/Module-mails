'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { POI, PRAGUE_POIS, PRAGUE_CASTLE_CENTER, findNearestPOI, findNearbyPOIs } from '@/data/prague-pois'
import DiscoverButton from '@/components/DiscoverButton'
import POICard from '@/components/POICard'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

type AppState = 'welcome' | 'exploring' | 'viewing-poi'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('welcome')
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null)
  const [visitedPOIs, setVisitedPOIs] = useState<string[]>([])
  const [isLocating, setIsLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNearbyList, setShowNearbyList] = useState(false)
  const watchIdRef = useRef<number | null>(null)

  // Start watching geolocation
  const startGeolocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("La géolocalisation n'est pas supportée par votre navigateur.")
      return
    }

    setIsLocating(true)
    setError(null)

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setUserPosition(pos)
        setIsLocating(false)
        setAppState('exploring')
      },
      (err) => {
        console.error('Geolocation error:', err)
        // Use demo position at Prague Castle if geolocation fails
        setUserPosition({
          lat: PRAGUE_CASTLE_CENTER.lat + (Math.random() - 0.5) * 0.001,
          lng: PRAGUE_CASTLE_CENTER.lng + (Math.random() - 0.5) * 0.001,
        })
        setIsLocating(false)
        setAppState('exploring')
        setError("Position simulée — activez la géolocalisation pour une expérience réelle.")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )

    // Watch position updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setUserPosition({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {},
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    )
  }, [])

  // Cleanup watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Discover nearest POI
  const handleDiscover = useCallback(() => {
    if (!userPosition) {
      startGeolocation()
      return
    }

    const nearest = findNearestPOI(userPosition.lat, userPosition.lng, visitedPOIs)
    if (nearest) {
      setSelectedPOI(nearest)
      setAppState('viewing-poi')
      if (!visitedPOIs.includes(nearest.id)) {
        setVisitedPOIs((prev) => [...prev, nearest.id])
      }
    }
  }, [userPosition, visitedPOIs, startGeolocation])

  // Handle POI click from map
  const handlePOIClick = useCallback((poi: POI) => {
    setSelectedPOI(poi)
    setAppState('viewing-poi')
    setVisitedPOIs((prev) => (prev.includes(poi.id) ? prev : [...prev, poi.id]))
  }, [])

  // Close POI card
  const handleClosePOI = useCallback(() => {
    setSelectedPOI(null)
    setAppState('exploring')
  }, [])

  // Navigate to POI in Google Maps
  const handleNavigate = useCallback(() => {
    if (!selectedPOI) return
    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPOI.lat},${selectedPOI.lng}&travelmode=walking`
    window.open(url, '_blank')
  }, [selectedPOI])

  // Get nearby POIs for the list
  const nearbyPOIs = userPosition ? findNearbyPOIs(userPosition.lat, userPosition.lng, 1000) : []

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      {/* Map */}
      <MapView
        userPosition={userPosition}
        selectedPOI={selectedPOI}
        visitedPOIs={visitedPOIs}
        onPOIClick={handlePOIClick}
      />

      {/* Welcome Screen */}
      {appState === 'welcome' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-prague-dark via-prague-blue to-prague-dark">
          <div className="text-center px-8 max-w-md animate-fade-in">
            <div className="text-6xl mb-6">🏰</div>
            <h1 className="font-display text-4xl font-bold text-white mb-2">
              Château de Prague
            </h1>
            <p className="text-prague-gold font-display text-lg mb-6 italic">
              Votre guide interactif
            </p>
            <p className="text-gray-300 text-sm mb-8 leading-relaxed">
              Explorez le plus grand château ancien du monde grâce à la géolocalisation.
              Découvrez l&apos;histoire de chaque lieu en un clic.
            </p>

            <button
              onClick={startGeolocation}
              disabled={isLocating}
              className="discover-btn rounded-2xl px-8 py-4 text-prague-dark font-bold text-lg
                flex items-center gap-3 mx-auto mb-4"
            >
              {isLocating ? (
                <>
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Localisation...
                </>
              ) : (
                <>
                  📍 Commencer l&apos;exploration
                </>
              )}
            </button>

            <p className="text-gray-500 text-xs">
              La géolocalisation sera utilisée pour vous guider
            </p>
          </div>
        </div>
      )}

      {/* Top Bar */}
      {appState !== 'welcome' && (
        <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
          <div className="glass mx-4 mt-4 rounded-2xl px-4 py-3 pointer-events-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🏰</span>
              <div>
                <h1 className="font-display text-sm font-bold text-white leading-tight">
                  Château de Prague
                </h1>
                <p className="text-[10px] text-gray-400">Guide interactif</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Nearby list toggle */}
              <button
                onClick={() => setShowNearbyList(!showNearbyList)}
                className="glass-light rounded-xl p-2 transition-all hover:bg-white/10"
                aria-label="Lieux à proximité"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-prague-gold">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </button>

              {/* Re-center on user */}
              {userPosition && (
                <button
                  onClick={startGeolocation}
                  className="glass-light rounded-xl p-2 transition-all hover:bg-white/10"
                  aria-label="Recentrer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && appState !== 'welcome' && (
        <div className="absolute top-24 left-4 right-4 z-30 animate-slide-up">
          <div className="glass rounded-xl px-4 py-3 flex items-center gap-2 border-prague-red/30">
            <span className="text-sm">⚠️</span>
            <p className="text-xs text-gray-300 flex-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-gray-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Nearby POIs List */}
      {showNearbyList && appState !== 'welcome' && (
        <div className="absolute top-20 left-4 right-4 z-30 animate-slide-up">
          <div className="glass rounded-2xl p-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display text-lg font-bold text-white">
                Points d&apos;intérêt
              </h2>
              <button
                onClick={() => setShowNearbyList(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {(nearbyPOIs.length > 0 ? nearbyPOIs : PRAGUE_POIS.map((p) => ({ ...p, distance: 0 }))).map(
                (poi) => (
                  <button
                    key={poi.id}
                    onClick={() => {
                      handlePOIClick(poi)
                      setShowNearbyList(false)
                    }}
                    className="w-full glass-light rounded-xl p-3 flex items-center gap-3
                      hover:bg-white/10 transition-all text-left"
                  >
                    <span className="text-2xl">{poi.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{poi.name}</p>
                      <p className="text-xs text-gray-400 truncate">{poi.shortDescription}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {poi.distance > 0 && (
                        <span className="text-xs text-blue-300">
                          {poi.distance < 1000
                            ? `${Math.round(poi.distance)}m`
                            : `${(poi.distance / 1000).toFixed(1)}km`}
                        </span>
                      )}
                      {visitedPOIs.includes(poi.id) && (
                        <span className="text-green-400 text-xs">✓</span>
                      )}
                    </div>
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Panel: POI Card or Discover Button */}
      {appState !== 'welcome' && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none">
          <div className="pointer-events-auto mx-4 mb-6">
            {appState === 'viewing-poi' && selectedPOI ? (
              <div className="glass rounded-2xl p-4 bottom-sheet">
                <POICard
                  poi={selectedPOI}
                  userPosition={userPosition}
                  isVisited={visitedPOIs.includes(selectedPOI.id)}
                  onClose={handleClosePOI}
                  onNavigate={handleNavigate}
                />
              </div>
            ) : (
              <div className="flex justify-center pb-2">
                <DiscoverButton
                  onClick={handleDiscover}
                  isLoading={isLocating}
                  discoveredCount={visitedPOIs.length}
                  totalCount={PRAGUE_POIS.length}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  )
}
