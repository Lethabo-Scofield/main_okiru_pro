import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@toolkit/lib/auth";
import { useBbeeStore } from "@toolkit/lib/store";
import { AppLoader } from "@toolkit/components/Loader";
import LandingPage from "@toolkit/pages/LandingPage";

export default function LandingWrapper() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const { isDemoMode, loadDemoData } = useBbeeStore();

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

  return (
    <LandingPage
      onNavigateAuth={() => navigate("/auth")}
      onStartDemo={() => {
        loadDemoData();
        navigate("/dashboard");
      }}
    />
  );
}
