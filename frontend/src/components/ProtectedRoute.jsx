import { Navigate } from "react-router-dom";
import { useAuth } from "../auth";

// Wraps a page so only logged-in users can see it.
// While we're still checking the saved token, show nothing (avoids a flash).
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
