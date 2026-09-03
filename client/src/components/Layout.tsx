import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          ✈️ מתכנן טיולים חכם
        </Link>
        {user && (
          <nav className="app-nav">
            <span className="user-greeting">שלום, {user.name}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>
              התנתקות
            </button>
          </nav>
        )}
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
