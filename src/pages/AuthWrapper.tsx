import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@toolkit/lib/auth";
import { useBbeeStore } from "@toolkit/lib/store";
import { AppLoader } from "@toolkit/components/Loader";
import AuthPage from "@toolkit/pages/AuthPage";

export default function AuthWrapper() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { isDemoMode } = useBbeeStore();

  useEffect(() => {
    if (!isLoading && (user || isDemoMode)) {
      navigate("/dashboard");
    }
  }, [user, isLoading, isDemoMode, navigate]);

  if (isLoading) {
    return <AppLoader />;
  }

  if (user || isDemoMode) {
    return <AppLoader />;
  }

  return <AuthPage />;
}
