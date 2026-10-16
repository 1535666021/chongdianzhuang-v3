export interface GeoLocation {
  lat: number
  lng: number
  address: string
  formattedAddress?: string
}

export interface MapConfig {
  key: string
  zoom: number
  center: { lat: number; lng: number }
  markerIcon?: string
}
