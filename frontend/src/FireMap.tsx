import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

type Fire = {
  latitude: number
  longitude: number
  confidence: string | null
  frp: number | null
  acq_date: string | null
  acq_time: string | null
  satellite: string | null
  daynight: string | null
  source: string
}

type FiresResponse = {
  count: number
  cached: boolean
  fires: Fire[]
}

const API_BASE = 'http://localhost:8000'

// Tens of thousands of fires come back from a world query. Mounting one React
// <Marker> per point freezes the page (React reconciliation over 40k+ nodes) —
// so this layer is built imperatively with plain Leaflet objects instead,
// which is what leaflet.markercluster is actually designed to handle at scale.
function FireClusterLayer({ fires }: { fires: Fire[] }) {
  const map = useMap()

  useEffect(() => {
    const group = L.markerClusterGroup({
      chunkedLoading: true,
      disableClusteringAtZoom: 9,
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount()
        const sizeClass =
          count >= 1000 ? 'fire-cluster-xl' : count >= 100 ? 'fire-cluster-lg' : count >= 10 ? 'fire-cluster-md' : 'fire-cluster-sm'
        return L.divIcon({
          html: `<div class="fire-cluster ${sizeClass}"><span>${count}</span></div>`,
          className: '',
          iconSize: L.point(44, 44, true),
        })
      },
    })

    for (const fire of fires) {
      const marker = L.circleMarker([fire.latitude, fire.longitude], {
        radius: 5,
        weight: 1,
        color: '#8a2a1f',
        fillColor: '#E14B3B',
        fillOpacity: 0.85,
      }).bindPopup(
        `<strong>FRP:</strong> ${fire.frp ?? 'n/a'}<br/>` +
          `<strong>Date:</strong> ${fire.acq_date ?? ''} ${fire.acq_time ?? ''}<br/>` +
          `<strong>Satellite:</strong> ${fire.satellite ?? 'n/a'}<br/>` +
          `<strong>Confidence:</strong> ${fire.confidence ?? 'n/a'}`,
      )
      group.addLayer(marker)
    }

    map.addLayer(group)
    return () => {
      map.removeLayer(group)
    }
  }, [map, fires])

  return null
}

function FireMap() {
  const [fires, setFires] = useState<Fire[]>([])
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading')

  useEffect(() => {
    let cancelled = false

    fetch(`${API_BASE}/api/fires?bbox=-180,-90,180,90&days=1`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        return res.json() as Promise<FiresResponse>
      })
      .then((data) => {
        if (cancelled) return
        setFires(data.fires)
        setStatus('success')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (status === 'error') {
    return (
      <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
        Couldn't load fire data. Is the backend running on http://localhost:8000?
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            background: 'white',
            padding: '6px 12px',
            borderRadius: 6,
            fontFamily: 'sans-serif',
            fontSize: 14,
          }}
        >
          Loading fires…
        </div>
      )}
      <MapContainer
        center={[20, 0]}
        zoom={3}
        style={{ width: '100%', height: '100%' }}
        worldCopyJump
        preferCanvas
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {status === 'success' && <FireClusterLayer fires={fires} />}
      </MapContainer>
    </div>
  )
}

export default FireMap
