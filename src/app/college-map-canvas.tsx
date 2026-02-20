"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { formatMoney, formatPercent, localeLabel } from "@/lib/format";

type MapItem = {
  slug: string;
  rank: number;
  name: string;
  city: string | null;
  state: string | null;
  latitude: number;
  longitude: number;
  costOfAttendance: number | null;
  admissionRate: number | null;
  medianEarnings10y: number | null;
  settingLabel: string;
  markerColor: string;
};

type Props = {
  items: MapItem[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
};

const US_CENTER: LatLngExpression = [39.5, -98.35];

function MapFocus({ selected }: { selected: MapItem | null }) {
  const map = useMap();

  useEffect(() => {
    if (!selected) return;
    map.flyTo([selected.latitude, selected.longitude], 7, { duration: 0.6 });
  }, [selected, map]);

  return null;
}

export default function CollegeMapCanvas({ items, selectedSlug, onSelect }: Props) {
  const selected = items.find((item) => item.slug === selectedSlug) ?? null;

  return (
    <MapContainer center={US_CENTER} zoom={4} scrollWheelZoom className="college-map-canvas">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapFocus selected={selected} />

      {items.map((item) => {
        const isSelected = item.slug === selectedSlug;

        return (
          <CircleMarker
            key={item.slug}
            center={[item.latitude, item.longitude]}
            pathOptions={{
              color: isSelected ? "#fff" : item.markerColor,
              weight: isSelected ? 3 : 1,
              fillColor: item.markerColor,
              fillOpacity: isSelected ? 0.98 : 0.78
            }}
            radius={isSelected ? 9 : 7}
            eventHandlers={{ click: () => onSelect(item.slug) }}
          >
            <Popup>
              <strong>#{item.rank} {item.name}</strong>
              <br />
              {item.city && item.state ? `${item.city}, ${item.state}` : "Location unavailable"}
              <br />
              Setting: {localeLabel(item.settingLabel)}
              <br />
              Acceptance: {formatPercent(item.admissionRate)}
              <br />
              Cost of Attendance: {formatMoney(item.costOfAttendance)}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
