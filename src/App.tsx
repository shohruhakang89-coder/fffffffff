import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppRoutes } from "./app/AppRoutes";
import { CallOverlay } from "./features/call/CallOverlay";
import { SplashPage } from "./features/auth/SplashPage";
import { useAccountsStore } from "./store/accountsStore";
import { useAuthStore } from "./store/authStore";
import { rpc } from "./store/client";

export default function App() {
  const status = useAuthStore((store) => store.status);

  useEffect(() => {
    // Open the encrypted channel and validate any stored session before the
    // first real frame, so a reload never flashes the login form.
    void rpc.connect();
    void useAuthStore.getState().restore();
    useAccountsStore.getState().hydrate();
  }, []);

  if (status === "unknown") return <SplashPage />;
  return (
    <BrowserRouter>
      <CallOverlay />
      <AppRoutes />
    </BrowserRouter>
  );
}
