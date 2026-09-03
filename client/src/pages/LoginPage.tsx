import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { extractErrorMessage } from "../api/client";
import { TravelBackground } from "../components/TravelBackground";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <TravelBackground />
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>התחברות</h2>
        {error && <p className="form-error">{error}</p>}
        <label>
          אימייל
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label>
          סיסמה
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "מתחבר..." : "התחברות"}
        </button>
        <p className="auth-switch">
          אין לך חשבון? <Link to="/register">הרשמה</Link>
        </p>
      </form>
    </div>
  );
}
