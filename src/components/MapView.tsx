'use client'

import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'
import { POI, PRAGUE_POIS, PRAGUE_CASTLE_CENTER } from '@/data/prague-pois'

interface MapViewProps {
  userPosition: { lat: number; lng: number } | null
  selectedPOI: POI | null
  visitedPOIs: string[]
  onPOIClick: (poi: POI) => void
}

const categoryColors: Record<POI['category'], string> = {
  monument: '#C9A84C',
  church: '#9382DC',
  garden: '#4CAF50',
  museum: '#E94560',
  viewpoint: '#29B6F6',
  street: '#FFB74D',
}

function createPOIIcon(poi: POI, isVisited: boolean, isSelected: boolean): L.DivIcon {
  const color = categoryColors[poi.category]
  const size = isSelected ? 44 : 36
  const opacity = isVisited ? '1' : '0.85'
  const ring = isSelected
    ? `box-shadow: 0 0 0 4px ${color}40, 0 0 20px ${color}60;`
    : ''
  const checkmark = isVisited
    ? `<div style="position:absolute;top:-4px;right:-4px;width:16px;height:16px;background:#4CAF50;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;border:2px solid #1A1A2E;">✓</div>`
    : ''

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;height:${size}px;
        background:linear-gradient(135deg, ${color}, ${color}CC);
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-size:${isSelected ? 22 : 18}px;
        border:3px solid #1A1A2E;
        opacity:${opacity};
        ${ring}
        transition: all 0.3s ease;
        position:relative;
        cursor:pointer;
      ">
        ${poi.emoji}
        ${checkmark}
      </div>
    `,
    className: 'custom-poi-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="position:relative;width:24px;height:24px;">
        <div style="
          position:absolute;top:0;left:0;
          width:24px;height:24px;
          background:#4285F4;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 8px rgba(66,133,244,0.5);
          z-index:2;
        "></div>
        <div style="
          position:absolute;top:-8px;left:-8px;
          width:40px;height:40px;
          background:rgba(66,133,244,0.2);
          border-radius:50%;
          z-index:1;
          animation: markerPulse 2s ease-out infinite;
        "></div>
      </div>
    `,
    className: 'user-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export default function MapView({ userPosition, selectedPOI, visitedPOIs, onPOIClick }: MapViewProps) {
  const mapRef = useRef<L.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const markersRef = useRef<Map<string, L.Marker>>(new Map())
  const userMarkerRef = useRef<L.Marker | null>(null)

  const handlePOIClick = useCallback(
    (poi: POI) => {
      onPOIClick(poi)
    },
    [onPOIClick]
  )

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return

    const map = L.map(mapContainerRef.current, {
      center: [PRAGUE_CASTLE_CENTER.lat, PRAGUE_CASTLE_CENTER.lng],
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
    })

    L.control.zoom({ position: 'topright' }).addTo(map)

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      subdomains: 'abcd',
    }).addTo(map)

    L.control
      .attribution({ position: 'bottomleft', prefix: false })
      .addTo(map)
      .addAttribution(
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
      )

    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Add/update POI markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    PRAGUE_POIS.forEach((poi) => {
      const isVisited = visitedPOIs.includes(poi.id)
      const isSelected = selectedPOI?.id === poi.id
      const icon = createPOIIcon(poi, isVisited, isSelected)

      const existing = markersRef.current.get(poi.id)
      if (existing) {
        existing.setIcon(icon)
      } else {
        const marker = L.marker([poi.lat, poi.lng], { icon })
          .addTo(map)
          .on('click', () => handlePOIClick(poi))
        markersRef.current.set(poi.id, marker)
      }
    })
  }, [selectedPOI, visitedPOIs, handlePOIClick])

  // Update user position marker
  useEffect(() => {
    const map = mapRef.current
    if (!map || !userPosition) return

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lng])
    } else {
      userMarkerRef.current = L.marker([userPosition.lat, userPosition.lng], {
        icon: createUserIcon(),
        zIndexOffset: 1000,
      }).addTo(map)
    }
  }, [userPosition])

  // Fly to selected POI
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedPOI) return

    map.flyTo([selectedPOI.lat, selectedPOI.lng], 18, {
      duration: 1,
      easeLinearity: 0.25,
    })
  }, [selectedPOI])

  return (
    <div
      ref={mapContainerRef}
      className="absolute inset-0"
      style={{ zIndex: 1 }}
    />
  )
}
