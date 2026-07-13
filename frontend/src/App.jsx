import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Laundromat from "./pages/Laundromat";
import Directions from "./pages/Directions";
import Reservation from "./pages/Reservation";
import Wallet from "./pages/Wallet";
import TopupConfirm from "./pages/TopupConfirm";
import MachineQr from "./pages/MachineQr";
import ReserveConfirm from "./pages/ReserveConfirm";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/laundromat/:id"
            element={
              <ProtectedRoute>
                <Laundromat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/route/:id"
            element={
              <ProtectedRoute>
                <Directions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reserve/:machineId"
            element={
              <ProtectedRoute>
                <ReserveConfirm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reservation"
            element={
              <ProtectedRoute>
                <Reservation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wallet/topup"
            element={
              <ProtectedRoute>
                <TopupConfirm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/machine/:id/qr"
            element={
              <ProtectedRoute>
                <MachineQr />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
