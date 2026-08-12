'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, LayersControl, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Home, Users, Search, Download } from 'lucide-react'
import * as htmlToImage from 'html-to-image'

// Fix for default Leaflet icon issues in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Subcomponent to control map events (flyTo)
function MapController({ selectedRegion, geoJsonRef, geoJsonData }: { selectedRegion: string, geoJsonRef: React.RefObject<any>, geoJsonData: any }) {
  const map = useMap();
  
  // Auto-fit bounds on initial load
  useEffect(() => {
    if (geoJsonRef.current && geoJsonData) {
      try {
        const bounds = geoJsonRef.current.getBounds();
        if (bounds && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [10, 10] });
        }
      } catch (err) {
        console.warn('Failed to fit bounds', err);
      }
    }
  }, [map, geoJsonRef, geoJsonData]);

  useEffect(() => {
    if (selectedRegion && geoJsonRef.current) {
      const layer = geoJsonRef.current.getLayers().find((l: any) => 
        l.feature.properties.wadmkd?.toUpperCase() === selectedRegion
      );
      if (layer) {
        map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.5 });
      }
    }
  }, [selectedRegion, map, geoJsonRef]);
  return null;
}

// Simple helper to generate a choropleth color (Green -> Yellow -> Red)
// Based on a percentage (0 to 1)
function getColor(percent: number) {
  if (percent >= 0.8) return '#991b1b' // Dark Red (Maroon) - High Priority
  if (percent >= 0.6) return '#ef4444' // Red
  if (percent >= 0.4) return '#f97316' // Orange
  if (percent >= 0.2) return '#eab308' // Yellow
  return '#22c55e' // Green - Low Priority
}

export default function GisMapClient({ data, selectedPeriod = '' }: { data: any[], selectedPeriod?: string }) {
  const [geoJsonData, setGeoJsonData] = useState<any>(null)
  const [metricTarget, setMetricTarget] = useState<'total' | 'desil15'>('total')
  const [metricType, setMetricType] = useState<'individu' | 'keluarga'>('individu')

  // UI Controls state
  const [opacity, setOpacity] = useState<number>(0.7)
  const [showBorders, setShowBorders] = useState<boolean>(true)
  const [selectedRegion, setSelectedRegion] = useState<string>('')
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const geoJsonLayerRef = useRef<any>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  // Load the GeoJSON on mount
  useEffect(() => {
    fetch('/geojson/administrasi.geojson')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error('Failed to load GeoJSON', err))
  }, [])

  // Aggregate stats by Kalurahan
  const stats = useMemo(() => {
    const agg: Record<string, { k: number, i: number, d15k: number, d15i: number, kec: string }> = {}
    data.forEach(row => {
      if (!row.kelurahan) return
      // Normalize to upper case for safer matching
      const key = row.kelurahan.toUpperCase()
      if (!agg[key]) agg[key] = { k: 0, i: 0, d15k: 0, d15i: 0, kec: row.kecamatan }
      agg[key].k += row.total_keluarga || 0
      agg[key].i += row.total_individu || 0
      
      const d15k = (row.d1_keluarga||0) + (row.d2_keluarga||0) + (row.d3_keluarga||0) + (row.d4_keluarga||0) + (row.d5_keluarga||0)
      const d15i = (row.d1_individu||0) + (row.d2_individu||0) + (row.d3_individu||0) + (row.d4_individu||0) + (row.d5_individu||0)
      
      agg[key].d15k += d15k
      agg[key].d15i += d15i
    })
    return agg
  }, [data])

  // Options for search dropdown
  const searchOptions = useMemo(() => {
    return Object.keys(stats).sort((a, b) => a.localeCompare(b));
  }, [stats]);

  // Determine Max for color scaling
  const maxVal = useMemo(() => {
    let max = 0
    Object.values(stats).forEach(val => {
      let v = 0
      if (metricTarget === 'total') {
        v = metricType === 'individu' ? val.i : val.k
      } else {
        v = metricType === 'individu' ? val.d15i : val.d15k
      }
      if (v > max) max = v
    })
    return max
  }, [stats, metricType, metricTarget])

  // GeoJSON Styling function
  const styleFeature = (feature: any) => {
    const name = feature.properties.wadmkd ? feature.properties.wadmkd.toUpperCase() : ''
    const stat = stats[name]
    const val = stat ? (
      metricTarget === 'total' 
        ? (metricType === 'individu' ? stat.i : stat.k) 
        : (metricType === 'individu' ? stat.d15i : stat.d15k)
    ) : 0
    
    // Calculate percentage relative to max
    const percent = maxVal > 0 ? val / maxVal : 0

    return {
      fillColor: getColor(percent),
      weight: showBorders ? 2 : 0,
      opacity: 1,
      color: 'white', // Border color
      dashArray: '3',
      fillOpacity: opacity
    }
  }

  // Tooltip interaction
  const onEachFeature = (feature: any, layer: any) => {
    const kalurahanName = feature.properties.wadmkd || ''
    const key = kalurahanName.toUpperCase()
    const stat = stats[key] || { k: 0, i: 0, d15k: 0, d15i: 0, kec: feature.properties.wadmkc || 'Unknown' }
    
    const displayK = metricTarget === 'total' ? stat.k : stat.d15k
    const displayI = metricTarget === 'total' ? stat.i : stat.d15i
    const targetLabel = metricTarget === 'total' ? 'Total Keseluruhan' : 'Fokus Desil 1-5'
    
    // Bind Tooltip
    const tooltipContent = `
      <div style="font-family: inherit; padding: 2px;">
        <h4 style="margin: 0 0 2px 0; font-size: 14px; font-weight: bold; color: #111827;">Kal. ${kalurahanName}</h4>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #6b7280; text-transform: uppercase;">Kap. ${stat.kec} &bull; ${targetLabel}</p>
        <div style="display: flex; justify-content: space-between; gap: 16px; margin-bottom: 4px; color: #4b5563; font-size: 12px;">
          <span>Keluarga:</span>
          <span style="font-weight: 600; color: #000;">${displayK.toLocaleString('id-ID')}</span>
        </div>
        <div style="display: flex; justify-content: space-between; gap: 16px; color: #4b5563; font-size: 12px;">
          <span>Individu:</span>
          <span style="font-weight: 600; color: #000;">${displayI.toLocaleString('id-ID')}</span>
        </div>
      </div>
    `
    layer.bindTooltip(tooltipContent, {
      sticky: true,
      className: 'custom-leaflet-tooltip'
    })

    // Highlight on hover
    layer.on({
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({
          weight: 3,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        });
        l.bringToFront();
      },
      mouseout: (e: any) => {
        if (geoJsonLayerRef.current && e.target) {
          try {
            geoJsonLayerRef.current.resetStyle(e.target);
          } catch (err) {
            console.warn('resetStyle failed', err);
          }
        }
      }
    })
  }

  // Update styles dynamically without unmounting the GeoJSON layer
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.setStyle(styleFeature);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metricTarget, metricType, opacity, showBorders, stats, maxVal]);

  const handleExportMap = async () => {
    if (!mapContainerRef.current) return;
    setIsExporting(true);
    try {
      const dataUrl = await htmlToImage.toPng(mapContainerRef.current, {
        cacheBust: true,
        style: { background: 'white' },
        pixelRatio: 2
      });
      const link = document.createElement('a');
      link.download = `Peta-GIS-${metricTarget}-${metricType}-${new Date().getTime()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export map', err);
      alert('Gagal mengekspor peta. Pastikan memori cukup atau coba basemap lain.');
    } finally {
      setIsExporting(false);
    }
  }

  if (!geoJsonData) {
    return (
      <div className="h-[600px] w-full flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-500 font-medium">Memuat Data Peta...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 relative z-10">
      {/* Map Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm relative z-20">
        
        {/* Toggle Target and Metric Type */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm shrink-0">
            <button 
              onClick={() => setMetricTarget('total')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${metricTarget === 'total' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              Total Keseluruhan
            </button>
            <button 
              onClick={() => setMetricTarget('desil15')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${metricTarget === 'desil15' ? 'bg-red-800 text-white shadow-sm' : 'text-gray-600 hover:bg-red-50'}`}
            >
              Fokus Desil 1-5
            </button>
          </div>
          
          <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm shrink-0">
            <button 
              onClick={() => setMetricType('individu')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${metricType === 'individu' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Users size={16} /> Individu
            </button>
            <button 
              onClick={() => setMetricType('keluarga')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${metricType === 'keluarga' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Home size={16} /> Keluarga
            </button>
          </div>
        </div>
        
        {/* New UI Controls: Search, Opacity, Border, Export */}
        <div className="flex flex-wrap items-center gap-3">
           {/* Quick Search */}
           <div className="relative">
             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search size={16} />
             </div>
             <select 
               className="pl-9 pr-8 py-2 text-sm bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 shadow-sm appearance-none min-w-[180px]"
               value={selectedRegion}
               onChange={(e) => setSelectedRegion(e.target.value)}
             >
               <option value="">Cari Wilayah...</option>
               {searchOptions.map(name => (
                 <option key={name} value={name}>{name}</option>
               ))}
             </select>
           </div>
           
           {/* Opacity & Border Config */}
           <div className="flex items-center gap-4 bg-white px-3 py-2 border border-gray-200 rounded-md shadow-sm">
             <div className="flex items-center gap-2" title="Sesuaikan opasitas (transparansi) area">
               <span className="text-xs font-medium text-gray-600">Opasitas</span>
               <input 
                 type="range" 
                 min="0.2" max="0.9" step="0.1" 
                 value={opacity} 
                 onChange={(e) => setOpacity(parseFloat(e.target.value))}
                 className="w-20 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
               />
             </div>
             <div className="w-px h-4 bg-gray-200"></div>
             <label className="flex items-center gap-2 cursor-pointer" title="Tampilkan/sembunyikan garis batas">
               <input 
                 type="checkbox" 
                 checked={showBorders}
                 onChange={(e) => setShowBorders(e.target.checked)}
                 className="rounded border-gray-300 text-red-600 focus:ring-red-500 focus:ring-offset-0"
               />
               <span className="text-xs font-medium text-gray-600">Batas</span>
             </label>
           </div>
           
           {/* Export Button */}
           <button 
             onClick={handleExportMap}
             disabled={isExporting}
             className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50"
           >
             <Download size={16} /> {isExporting ? 'Mengekspor...' : 'Ekspor PNG'}
           </button>
        </div>

      </div>

      {/* The Map */}
      <div 
        ref={mapContainerRef}
        className="h-[calc(100vh-280px)] min-h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-inner z-0 relative bg-white"
      >
        {/* Floating Legend rendered on top of map container */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/50 backdrop-blur-lg p-4 rounded-xl border border-white/60 shadow-xl min-w-[240px]" data-html2canvas-ignore="false">
          <h4 className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-200/50 pb-2">Tingkat Konsentrasi</h4>
          <div className="flex items-center gap-3 text-xs font-medium text-gray-700">
            <span className="text-gray-500">Rendah</span>
            <div className="flex h-3 w-32 rounded-full overflow-hidden">
              <div className="flex-1 bg-[#22c55e]"></div>
              <div className="flex-1 bg-[#eab308]"></div>
              <div className="flex-1 bg-[#f97316]"></div>
              <div className="flex-1 bg-[#ef4444]"></div>
              <div className="flex-1 bg-[#991b1b]"></div>
            </div>
            <span className="font-bold text-red-900">Tinggi</span>
          </div>
        </div>

        <MapContainer 
          center={[-7.9667, 110.6000]} // Gunungkidul Center
          zoom={11}
          zoomSnap={0.1}
          zoomDelta={0.5}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Light Mode">
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                crossOrigin="anonymous"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Satellite View">
              <TileLayer
                attribution='&copy; Esri'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                crossOrigin="anonymous"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Dark Mode">
              <TileLayer
                attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                crossOrigin="anonymous"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          <GeoJSON 
            key={`geojson-kalurahan-${selectedPeriod}`}
            data={geoJsonData}
            style={styleFeature}
            onEachFeature={onEachFeature}
            ref={geoJsonLayerRef}
          />
          <MapController selectedRegion={selectedRegion} geoJsonRef={geoJsonLayerRef} geoJsonData={geoJsonData} />
        </MapContainer>
      </div>

      {/* Inject minor css for tooltips and leaflet layers control */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-leaflet-tooltip {
          background-color: rgba(255, 255, 255, 0.98);
          border: 1px solid #e5e7eb;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          border-radius: 8px;
        }
        /* Fix Leaflet control z-index */
        .leaflet-top, .leaflet-bottom {
          z-index: 500 !important;
        }
      `}} />
    </div>
  )
}
