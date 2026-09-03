import { useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import type { Activity } from "../api/types";

const containerStyle = { width: "100%", height: "320px", borderRadius: "12px" };

interface TripMapProps {
  activities: Activity[];
  centerLat?: number | null;
  centerLng?: number | null;
}

export function TripMap({ activities, centerLat, centerLng }: TripMapProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? "",
    id: "trip-planner-google-maps",
  });

  const points = useMemo(
    () => activities.filter((a) => a.lat != null && a.lng != null),
    [activities]
  );

  const center = useMemo(() => {
    if (centerLat != null && centerLng != null) return { lat: centerLat, lng: centerLng };
    if (points.length > 0) return { lat: points[0].lat!, lng: points[0].lng! };
    return { lat: 41.9028, lng: 12.4964 }; // ברירת מחדל: רומא
  }, [centerLat, centerLng, points]);

  if (!apiKey) {
    return (
      <div className="map-placeholder">
        לא הוגדר VITE_GOOGLE_MAPS_API_KEY - הוסף מפתח ב-.env כדי להציג מפה.
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="map-placeholder">טוען מפה...</div>;
  }

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
      {points.map((activity) => (
        <Marker
          key={activity.id}
          position={{ lat: activity.lat!, lng: activity.lng! }}
          title={activity.name}
        />
      ))}
    </GoogleMap>
  );
}
