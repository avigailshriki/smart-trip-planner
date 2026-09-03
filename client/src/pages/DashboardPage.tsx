import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listTripsRequest } from "../api/trips";
import { TripCard } from "../components/TripCard";

export function DashboardPage() {
  const { data: trips, isLoading, isError } = useQuery({
    queryKey: ["trips"],
    queryFn: listTripsRequest,
  });

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>הטיולים שלי</h1>
        <Link to="/trips/new" className="btn btn-primary">
          + טיול חדש
        </Link>
      </div>

      {isLoading && <p>טוען טיולים...</p>}
      {isError && <p className="form-error">שגיאה בטעינת הטיולים</p>}

      {trips && trips.length === 0 && (
        <div className="empty-state">
          <p>עדיין אין לך טיולים מתוכננים.</p>
          <Link to="/trips/new" className="btn btn-primary">
            תכנן את הטיול הראשון שלך
          </Link>
        </div>
      )}

      <div className="trip-grid">
        {trips?.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  );
}
