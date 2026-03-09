import { useBbeeStore } from "@toolkit/lib/store";
import { useAuth } from "@toolkit/lib/auth";
import { LogOut, FlaskConical, ChevronLeft, LayoutDashboard } from "lucide-react";
import { Button } from "@toolkit/components/ui/button";
import { Link, useLocation } from "wouter";
import { Badge } from "@toolkit/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@toolkit/components/ui/tooltip";

export function Topbar() {
  const { user, logout } = useAuth();
  const client = useBbeeStore(s => s.client);
  const isDemoMode = useBbeeStore(s => s.isDemoMode);
  const clearData = useBbeeStore(s => s.clearData);
  const [, navigate] = useLocation();

  const handleExitDemo = () => {
    clearData();
    window.location.href = '/';
  };

  const handleBackToPlatform = () => {
    window.location.href = '/dashboard';
  };

  const handleLogout = () => {
    logout();
  };

  const initials = isDemoMode ? "DM" : (user?.fullName || user?.username || "U")
    .split(" ")
    .map(w => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="flex h-11 items-center justify-between border-b border-border/40 bg-background/70 backdrop-blur-xl px-6 z-50 sticky top-0" data-testid="topbar">
      <div className="flex items-center gap-2.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 transition-all duration-200"
              onClick={handleBackToPlatform}
              data-testid="btn-back-platform"
            >
              <ChevronLeft className="h-4 w-4" />
              <LayoutDashboard className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Back to Platform</p>
          </TooltipContent>
        </Tooltip>
        <div className="h-3.5 w-px bg-border/30" />
        {isDemoMode && (
          <Badge variant="secondary" className="text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 mr-1 gap-1" data-testid="badge-demo-mode">
            <FlaskConical className="h-3 w-3" />
            DEMO
          </Badge>
        )}
        <span className="text-[13px] font-medium text-foreground/70">{client.name || 'No client selected'}</span>
        {client.financialYear && (
          <span className="text-[11px] text-muted-foreground/40 font-medium">FY {client.financialYear}</span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <div className="h-3.5 w-px bg-border/40 mx-1" />
        {isDemoMode ? (
          <Button variant="ghost" size="sm" className="h-7 text-[11px] text-muted-foreground/60 hover:text-foreground gap-1" onClick={handleExitDemo} data-testid="btn-exit-demo">
            <LogOut className="h-3 w-3" />
            Exit Demo
          </Button>
        ) : (
          <>
            <Link href="/profile" data-testid="link-profile">
              <div className="h-6 w-6 rounded-full bg-muted/70 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-1 hover:ring-border">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[9px] font-semibold text-muted-foreground/70">{initials}</span>
                )}
              </div>
            </Link>
            <span className="text-[11px] text-muted-foreground/50 hidden lg:inline ml-1">{user?.fullName || user?.username}</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="flex items-center justify-center rounded-md p-1.5 text-muted-foreground/40 hover:text-foreground hover:bg-muted/50 transition-colors duration-200" onClick={handleLogout} data-testid="btn-topbar-logout">
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Sign out</p>
              </TooltipContent>
            </Tooltip>
          </>
        )}
      </div>
    </header>
  );
}
