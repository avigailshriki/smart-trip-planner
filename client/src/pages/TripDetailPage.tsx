import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addActivityRequest,
  deleteActivityRequest,
  deleteTripRequest,
  generateTripRequest,
  getTripRequest,
  updateActivityRequest,
} from "../api/trips";
import { StatusBadge } from "../components/StatusBadge";
import { ActivityCard } from "../components/ActivityCard";
import { TripMap } from "../components/TripMap";
import { extractErrorMessage } from "../api/client";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
  });
}

export function TripDetailPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const tripQuery = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => getTripRequest(tripId!),
    enabled: !!tripId,
    refetchInterval: (query) => (query.state.data?.status === "GENERATING" ? 2000 : false),
  });

  const generateMutation = useMutation({
    mutationFn: () => generateTripRequest(tripId!),
    onSuccess: (trip) => queryClient.setQueryData(["trip", tripId], trip),
    onError: (err) => setActionError(extractErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTripRequest(tripId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      navigate("/");
    },
  });

  const invalidateTrip = () => queryClient.invalidateQueries({ queryKey: ["trip", tripId] });

  const trip = tripQuery.data;

  if (tripQuery.isLoading) return <p>טוען טיול...</p>;
  if (tripQuery.isError || !trip) return <p className="form-error">הטיול לא נמצא</p>;

  const allActivities = trip.days.flatMap((d) => d.activities);

  return (
    <div className="trip-detail-page">
      <div className="trip-detail-header">
        <div>
          <h1>{trip.destinationName}</h1>
          <p>
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </p>
          <StatusBadge status={trip.status} />
        </div>
        <div className="trip-detail-actions">
          {(trip.status === "DRAFT" || trip.status === "FAILED") && (
            <button
              className="btn btn-primary"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              {generateMutation.isPending ? "יוצר מסלול..." : "🪄 צור מסלול עם AI"}
            </button>
          )}
          {trip.status === "READY" && (
            <button
              className="btn btn-ghost"
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
            >
              צור מחדש
            </button>
          )}
          <button
            className="btn btn-danger"
            onClick={() => {
              if (confirm("למחוק את הטיול?")) deleteMutation.mutate();
            }}
          >
            מחק טיול
          </button>
        </div>
      </div>

      {actionError && <p className="form-error">{actionError}</p>}
      {trip.status === "FAILED" && trip.generationError && (
        <p className="form-error">יצירת המסלול נכשלה: {trip.generationError}</p>
      )}
      {trip.status === "GENERATING" && (
        <p className="generating-notice">
          מייצר מסלול מותאם אישית - שולף מקומות, בודק תחזית מזג אוויר ומריץ AI... זה עשוי לקחת כמה שניות.
        </p>
      )}

      {allActivities.length > 0 && (
        <TripMap
          activities={allActivities}
          centerLat={trip.destinationLat}
          centerLng={trip.destinationLng}
        />
      )}

      <div className="trip-days">
        {trip.days.map((day) => (
          <DayColumn key={day.id} tripId={trip.id} day={day} onChanged={invalidateTrip} />
        ))}
      </div>

      {trip.status === "DRAFT" && trip.days.length === 0 && (
        <div className="empty-state">
          <p>עוד לא נוצר מסלול לטיול הזה. לחץ על "צור מסלול עם AI" כדי להתחיל.</p>
        </div>
      )}
    </div>
  );
}

function DayColumn({
  tripId,
  day,
  onChanged,
}: {
  tripId: string;
  day: { id: string; dayIndex: number; date: string; summary: string | null; activities: any[] };
  onChanged: () => void;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [startTime, setStartTime] = useState("");

  const addMutation = useMutation({
    mutationFn: () => addActivityRequest(tripId, day.id, { name, startTime: startTime || undefined }),
    onSuccess: () => {
      setName("");
      setStartTime("");
      setShowAddForm(false);
      onChanged();
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ activityId, input }: { activityId: string; input: any }) =>
      updateActivityRequest(tripId, day.id, activityId, input),
    onSuccess: onChanged,
  });

  const deleteMutation = useMutation({
    mutationFn: (activityId: string) => deleteActivityRequest(tripId, day.id, activityId),
    onSuccess: onChanged,
  });

  function handleAddSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    addMutation.mutate();
  }

  return (
    <div className="day-column">
      <div className="day-column-header">
        <h3>יום {day.dayIndex + 1}</h3>
        <span>{formatDate(day.date)}</span>
      </div>
      {day.summary && <p className="day-summary">{day.summary}</p>}

      {day.activities.map((activity) => (
        <ActivityCard
          key={activity.id}
          activity={activity}
          onDelete={() => deleteMutation.mutate(activity.id)}
          onEdit={(input) => editMutation.mutateAsync({ activityId: activity.id, input })}
        />
      ))}

      {showAddForm ? (
        <form className="add-activity-form" onSubmit={handleAddSubmit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="שם פעילות"
            required
          />
          <input
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="HH:MM"
            className="activity-time-input"
          />
          <div className="activity-card-actions">
            <button className="btn btn-primary btn-sm" type="submit" disabled={addMutation.isPending}>
              הוסף
            </button>
            <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowAddForm(false)}>
              ביטול
            </button>
          </div>
        </form>
      ) : (
        <button className="btn btn-ghost btn-sm add-activity-btn" onClick={() => setShowAddForm(true)}>
          + הוסף פעילות
        </button>
      )}
    </div>
  );
}
