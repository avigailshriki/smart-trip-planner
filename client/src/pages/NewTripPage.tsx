import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createTripRequest } from "../api/trips";
import { INTEREST_OPTIONS } from "../api/types";
import type { BudgetLevel } from "../api/types";
import { extractErrorMessage } from "../api/client";

export function NewTripPage() {
  const navigate = useNavigate();
  const [destinationName, setDestinationName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budgetLevel, setBudgetLevel] = useState<BudgetLevel>("MEDIUM");
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const trip = await createTripRequest({
        destinationName,
        startDate,
        endDate,
        budgetLevel,
        interests,
      });
      navigate(`/trips/${trip.id}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="new-trip-page">
      <h1>תכנון טיול חדש</h1>
      <form className="trip-form" onSubmit={handleSubmit}>
        {error && <p className="form-error">{error}</p>}

        <label>
          יעד
          <input
            value={destinationName}
            onChange={(e) => setDestinationName(e.target.value)}
            placeholder="לדוגמה: רומא, איטליה"
            required
          />
        </label>

        <div className="form-row">
          <label>
            תאריך התחלה
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </label>
          <label>
            תאריך סיום
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </label>
        </div>

        <label>
          רמת תקציב
          <select value={budgetLevel} onChange={(e) => setBudgetLevel(e.target.value as BudgetLevel)}>
            <option value="LOW">נמוכה</option>
            <option value="MEDIUM">בינונית</option>
            <option value="HIGH">גבוהה</option>
          </select>
        </label>

        <fieldset className="interests-fieldset">
          <legend>תחומי עניין</legend>
          <div className="interests-grid">
            {INTEREST_OPTIONS.map((option) => (
              <label key={option.value} className="interest-checkbox">
                <input
                  type="checkbox"
                  checked={interests.includes(option.value)}
                  onChange={() => toggleInterest(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "יוצר..." : "צור טיול"}
        </button>
      </form>
    </div>
  );
}
