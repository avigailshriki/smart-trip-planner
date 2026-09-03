import { useState } from "react";
import type { Activity } from "../api/types";

interface ActivityCardProps {
  activity: Activity;
  onDelete: () => void;
  onEdit: (input: { name: string; description?: string; startTime?: string }) => Promise<void>;
}

export function ActivityCard({ activity, onDelete, onEdit }: ActivityCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(activity.name);
  const [description, setDescription] = useState(activity.description ?? "");
  const [startTime, setStartTime] = useState(activity.startTime ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onEdit({ name, description, startTime: startTime || undefined });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (isEditing) {
    return (
      <div className="activity-card activity-card-editing">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="שם הפעילות" />
        <input
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          placeholder="HH:MM"
          className="activity-time-input"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="תיאור"
        />
        <div className="activity-card-actions">
          <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleSave}>
            שמור
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(false)}>
            ביטול
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="activity-card">
      <div className="activity-card-main">
        {activity.startTime && <span className="activity-time">{activity.startTime}</span>}
        <div>
          <h4>{activity.name}</h4>
          {activity.description && <p className="activity-description">{activity.description}</p>}
          <div className="activity-meta">
            {activity.category && <span className="tag tag-sm">{activity.category}</span>}
            {activity.durationMinutes && <span>⏱ {activity.durationMinutes} דק'</span>}
            {activity.estimatedCostUsd != null && <span>💵 ${activity.estimatedCostUsd}</span>}
            {activity.address && <span>📍 {activity.address}</span>}
          </div>
        </div>
      </div>
      <div className="activity-card-actions">
        <button className="btn btn-ghost btn-sm" onClick={() => setIsEditing(true)}>
          ערוך
        </button>
        <button className="btn btn-danger btn-sm" onClick={onDelete}>
          מחק
        </button>
      </div>
    </div>
  );
}
