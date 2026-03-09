import { useLocation } from "wouter";
import { useBbeeStore } from "@toolkit/lib/store";
import LandingPage from "@toolkit/pages/LandingPage";

export default function LandingWrapper() {
  const [, navigate] = useLocation();
  const { loadDemoData } = useBbeeStore();

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
