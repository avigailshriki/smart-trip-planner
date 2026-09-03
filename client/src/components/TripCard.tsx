import { Link } from "react-router-dom";
import type { Trip } from "../api/types";
import { StatusBadge } from "./StatusBadge";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function TripCard({ trip }: { trip: Trip }) {
  return (
    <Link to={`/trips/${trip.id}`} className="trip-card">
      <div className="trip-card-header">
        <h3>{trip.destinationName}</h3>
        <StatusBadge status={trip.status} />
      </div>
      <p className="trip-card-dates">
        {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
      </p>
      {trip.interests.length > 0 && (
        <div className="trip-card-tags">
          {trip.interests.map((interest) => (
            <span key={interest} className="tag">
              {interest}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
