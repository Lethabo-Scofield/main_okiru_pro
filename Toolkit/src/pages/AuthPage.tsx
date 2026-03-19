import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@toolkit/lib/auth";
import { Card, CardContent } from "@toolkit/components/ui/card";
import { Button } from "@toolkit/components/ui/button";
import { Input } from "@toolkit/components/ui/input";
import { Label } from "@toolkit/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@toolkit/components/ui/select";
import { Loader2, ArrowRight, ArrowLeft, Check, Building2, User, KeyRound, Shield } from "lucide-react";
import { useToast } from "@toolkit/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { API_BASE } from "@toolkit/lib/config";
import okiruLogo from "@toolkit-assets/Okiru_WHT_Circle_Logo_V1_1772658965196.png";

const ROLES = [
  { value: "auditor", label: "B-BBEE Auditor", description: "Conduct and manage compliance audits" },
  { value: "analyst", label: "Compliance Analyst", description: "Analyse scorecard data and reports" },
  { value: "manager", label: "Team Manager", description: "Oversee audit teams and review results" },
  { value: "admin", label: "Administrator", description: "Full system access and user management" },
];

const TOTAL_STEPS = 4;
const stepLabels = ["Organization", "Your Details", "Credentials", "Role"];
const stepIcons = [Building2, User, KeyRound, Shield];

interface OrgOption {
  id: string;
  name: string;
  emailDomain: string;
}

export default function AuthPage({ defaultMode = 'login' }: { defaultMode?: 'login' | 'register' } = {}) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    emailName: '',
    organizationId: '',
    subscriptionId: '',
    role: 'auditor',
  });

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch(`${API_BASE}/api/organizations`)
      .then(r => r.ok ? r.json() : [])
      .then(setOrganizations)
      .catch(() => setOrganizations([]));
  }, []);

  const selectedOrg = organizations.find(o => o.id === form.organizationId);
  const fullEmail = useMemo(() => {
    if (!form.emailName.trim() || !selectedOrg) return '';
    return `${form.emailName.trim().toLowerCase()}@${selectedOrg.emailDomain}`;
  }, [form.emailName, selectedOrg]);

  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {};
    if (s === 1) {
      if (!form.organizationId) errors.organizationId = "Please select your organization";
      if (!form.subscriptionId.trim()) errors.subscriptionId = "Subscription ID is required";
    } else if (s === 2) {
      if (!form.fullName.trim()) errors.fullName = "Full name is required";
      if (!form.emailName.trim()) errors.emailName = "Email name is required";
    } else if (s === 3) {
      if (!form.username.trim()) errors.username = "Username is required";
      else if (form.username.length < 3) errors.username = "At least 3 characters";
      if (!form.password) errors.password = "Password is required";
      else if (form.password.length < 4) errors.password = "At least 4 characters";
      if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";
    } else if (s === 4) {
      if (!form.role) errors.role = "Please select a role";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const goToStep = (target: number) => {
    if (target > step) {
      if (!validateStep(step)) return;
      setDirection(1);
    } else {
      setDirection(-1);
      setFieldErrors({});
    }
    setStep(target);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      setIsLoading(true);
      try {
        await login(form.username, form.password);
      } catch (error: any) {
        toast({ title: "Login Failed", description: error.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (!validateStep(step)) return;
    if (step < TOTAL_STEPS) { goToStep(step + 1); return; }
    setIsLoading(true);
    try {
      await register({
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        email: fullEmail,
        organizationId: form.organizationId,
        subscriptionId: form.subscriptionId,
        role: form.role,
      });
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToRegister = () => { setMode('register'); setStep(1); setFieldErrors({}); };
  const switchToLogin = () => { setMode('login'); setStep(1); setFieldErrors({}); };

  const StepIcon = stepIcons[(step - 1) % stepIcons.length];

  const pageVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      rotateY: dir > 0 ? 15 : -15,
      scale: 0.92,
      opacity: 0,
      zIndex: 10,
    }),
    center: {
      x: 0,
      rotateY: 0,
      scale: 1,
      opacity: 1,
      zIndex: 10,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      rotateY: dir > 0 ? -25 : 25,
      scale: 0.85,
      opacity: 0,
      zIndex: 0,
    }),
  };

  const pageTransition = {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  };

  const behindCards = mode === 'register'
    ? Array.from({ length: TOTAL_STEPS - step }, (_, i) => i)
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[420px]"
        style={{ perspective: 1200 }}
      >
        <div className="flex justify-center mb-8">
          <img src={okiruLogo} alt="Okiru" className="h-14 w-14 rounded-full object-contain" data-testid="img-logo-auth" />
        </div>

        <div className="relative" style={{ perspective: 1200 }}>
          {behindCards.map((i) => (
            <div
              key={`bg-${i}`}
              className="absolute inset-0 rounded-xl border border-border/20 bg-card/60"
              style={{
                transform: `translateY(${(i + 1) * 6}px) scale(${1 - (i + 1) * 0.02})`,
                zIndex: -i - 1,
                opacity: Math.max(0.15, 0.5 - i * 0.15),
              }}
            />
          ))}

          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={mode === 'login' ? 'login' : `step-${step}`}
              custom={direction}
              variants={pageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={pageTransition}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Card className="border border-border/50 shadow-lg bg-card overflow-hidden">
                <div className="text-center pt-8 pb-3 px-6">
                  <h2 className="text-lg font-heading font-semibold tracking-tight" data-testid="text-auth-title">
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </h2>
                  <p className="text-[13px] text-muted-foreground/60 mt-1">
                    {mode === 'login'
                      ? 'Access your compliance dashboard'
                      : (
                        <span className="flex items-center justify-center gap-1.5">
                          <StepIcon className="h-3.5 w-3.5" />
                          {stepLabels[step - 1]}
                          <span className="text-muted-foreground/40">— {step} of {TOTAL_STEPS}</span>
                        </span>
                      )
                    }
                  </p>
                </div>

                {mode === 'register' && (
                  <div className="px-6 pb-1">
                    <div className="flex items-center gap-1" data-testid="step-indicator">
                      {Array.from({ length: TOTAL_STEPS }, (_, i) => {
                        const s = i + 1;
                        const done = s < step;
                        const active = s === step;
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => { if (s < step) goToStep(s); }}
                            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${
                              done ? "bg-primary cursor-pointer" : active ? "bg-primary/70" : "bg-muted"
                            }`}
                            data-testid={`step-bar-${s}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                <CardContent className="px-6 pb-7 pt-4">
                  <form onSubmit={handleSubmit}>
                    {mode === 'login' ? (
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="login-user" className="text-[12px] font-medium text-muted-foreground/70">Username or Email</Label>
                          <Input
                            id="login-user"
                            required
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                            placeholder="username or email"
                            className="h-10"
                            autoComplete="username"
                            data-testid="input-username"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="login-pw" className="text-[12px] font-medium text-muted-foreground/70">Password</Label>
                          <Input
                            id="login-pw"
                            type="password"
                            required
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            placeholder="••••••••"
                            className="h-10"
                            autoComplete="current-password"
                            data-testid="input-password"
                          />
                        </div>
                        <Button
                          type="submit"
                          className="w-full h-10 text-[13px] font-medium rounded-full"
                          disabled={isLoading}
                          data-testid="btn-submit-auth"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {step === 1 && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium text-muted-foreground/70">Organization</Label>
                              <Select
                                value={form.organizationId}
                                onValueChange={v => {
                                  setForm({ ...form, organizationId: v });
                                  setFieldErrors(prev => ({ ...prev, organizationId: '' }));
                                }}
                              >
                                <SelectTrigger className="h-10" data-testid="select-organization">
                                  <SelectValue placeholder="Select your organization" />
                                </SelectTrigger>
                                <SelectContent>
                                  {organizations.map(org => (
                                    <SelectItem key={org.id} value={org.id}>
                                      <div className="flex items-center gap-2">
                                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                        {org.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldErrors.organizationId && (
                                <p className="text-[11px] text-destructive" data-testid="error-organization">{fieldErrors.organizationId}</p>
                              )}
                            </div>

                            {selectedOrg && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="rounded-lg border border-primary/20 bg-primary/5 p-3"
                              >
                                <p className="text-[11px] text-primary font-medium mb-0.5">{selectedOrg.name}</p>
                                <p className="text-[11px] text-muted-foreground">Enter the subscription ID provided by your organization.</p>
                              </motion.div>
                            )}

                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium text-muted-foreground/70">Subscription ID</Label>
                              <Input
                                value={form.subscriptionId}
                                onChange={e => {
                                  setForm({ ...form, subscriptionId: e.target.value.toUpperCase() });
                                  setFieldErrors(prev => ({ ...prev, subscriptionId: '' }));
                                }}
                                placeholder="e.g. OKR-2026-001"
                                className="h-10 font-mono text-sm tracking-wider"
                                data-testid="input-subscription-id"
                              />
                              {fieldErrors.subscriptionId && (
                                <p className="text-[11px] text-destructive" data-testid="error-subscription">{fieldErrors.subscriptionId}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {step === 2 && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium text-muted-foreground/70">Full Name</Label>
                              <Input
                                value={form.fullName}
                                onChange={e => {
                                  setForm({ ...form, fullName: e.target.value });
                                  setFieldErrors(prev => ({ ...prev, fullName: '' }));
                                }}
                                placeholder="e.g. Thabo Mokoena"
                                className="h-10"
                                autoComplete="name"
                                data-testid="input-fullname"
                              />
                              {fieldErrors.fullName && (
                                <p className="text-[11px] text-destructive" data-testid="error-fullname">{fieldErrors.fullName}</p>
                              )}
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium text-muted-foreground/70">Email</Label>
                              <div className="flex items-center gap-0">
                                <Input
                                  value={form.emailName}
                                  onChange={e => {
                                    const val = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '');
                                    setForm({ ...form, emailName: val });
                                    setFieldErrors(prev => ({ ...prev, emailName: '' }));
                                  }}
                                  placeholder="thabo"
                                  className="h-10 rounded-r-none border-r-0 flex-1"
                                  data-testid="input-email-name"
                                />
                                <div className="h-10 px-3 flex items-center bg-muted/50 border border-l-0 border-border rounded-r-md text-[12px] text-muted-foreground font-mono whitespace-nowrap">
                                  @{selectedOrg?.emailDomain || 'company.co.za'}
                                </div>
                              </div>
                              {fullEmail && (
                                <p className="text-[11px] text-muted-foreground/60 mt-1" data-testid="text-full-email">
                                  Your email: <span className="text-foreground font-medium">{fullEmail}</span>
                                </p>
                              )}
                              {fieldErrors.emailName && (
                                <p className="text-[11px] text-destructive" data-testid="error-email">{fieldErrors.emailName}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {step === 3 && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium text-muted-foreground/70">Username</Label>
                              <Input
                                value={form.username}
                                onChange={e => {
                                  setForm({ ...form, username: e.target.value });
                                  setFieldErrors(prev => ({ ...prev, username: '' }));
                                }}
                                placeholder="Choose a username"
                                className="h-10"
                                autoComplete="username"
                                data-testid="input-username"
                              />
                              {fieldErrors.username && (
                                <p className="text-[11px] text-destructive" data-testid="error-username">{fieldErrors.username}</p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium text-muted-foreground/70">Password</Label>
                              <Input
                                type="password"
                                value={form.password}
                                onChange={e => {
                                  setForm({ ...form, password: e.target.value });
                                  setFieldErrors(prev => ({ ...prev, password: '' }));
                                }}
                                placeholder="Min 4 characters"
                                className="h-10"
                                autoComplete="new-password"
                                data-testid="input-password"
                              />
                              {fieldErrors.password && (
                                <p className="text-[11px] text-destructive" data-testid="error-password">{fieldErrors.password}</p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium text-muted-foreground/70">Confirm Password</Label>
                              <Input
                                type="password"
                                value={form.confirmPassword}
                                onChange={e => {
                                  setForm({ ...form, confirmPassword: e.target.value });
                                  setFieldErrors(prev => ({ ...prev, confirmPassword: '' }));
                                }}
                                placeholder="Re-enter password"
                                className="h-10"
                                autoComplete="new-password"
                                data-testid="input-confirm-password"
                              />
                              {fieldErrors.confirmPassword && (
                                <p className="text-[11px] text-destructive" data-testid="error-confirm-password">{fieldErrors.confirmPassword}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {step === 4 && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-[12px] font-medium text-muted-foreground/70">Your Role</Label>
                              <div className="grid gap-2" data-testid="role-options">
                                {ROLES.map(r => (
                                  <button
                                    key={r.value}
                                    type="button"
                                    onClick={() => {
                                      setForm({ ...form, role: r.value });
                                      setFieldErrors(prev => ({ ...prev, role: '' }));
                                    }}
                                    className={`w-full text-left rounded-lg border p-3 transition-all duration-200 ${
                                      form.role === r.value
                                        ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                        : "border-border/50 hover:border-border hover:bg-muted/30"
                                    }`}
                                    data-testid={`btn-role-${r.value}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">{r.label}</span>
                                      {form.role === r.value && (
                                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                                          <Check className="h-3 w-3 text-primary-foreground" />
                                        </div>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">{r.description}</p>
                                  </button>
                                ))}
                              </div>
                              {fieldErrors.role && (
                                <p className="text-[11px] text-destructive" data-testid="error-role">{fieldErrors.role}</p>
                              )}
                            </div>

                            <div className="rounded-lg border border-border/30 bg-muted/20 p-3 space-y-1.5">
                              <p className="text-[11px] font-medium text-muted-foreground">Account Summary</p>
                              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[11px]">
                                <span className="text-muted-foreground/60">Organization</span>
                                <span className="text-foreground font-medium truncate">{selectedOrg?.name || '—'}</span>
                                <span className="text-muted-foreground/60">Name</span>
                                <span className="text-foreground font-medium truncate">{form.fullName || '—'}</span>
                                <span className="text-muted-foreground/60">Email</span>
                                <span className="text-foreground font-medium truncate">{fullEmail || '—'}</span>
                                <span className="text-muted-foreground/60">Username</span>
                                <span className="text-foreground font-medium truncate">{form.username || '—'}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          {step > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => goToStep(step - 1)}
                              className="h-10 text-[13px] rounded-full px-5"
                              data-testid="btn-prev-step"
                            >
                              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
                              Back
                            </Button>
                          )}
                          {step < TOTAL_STEPS ? (
                            <Button
                              type="button"
                              onClick={() => goToStep(step + 1)}
                              className="flex-1 h-10 text-[13px] font-medium rounded-full"
                              data-testid="btn-next-step"
                            >
                              Continue
                              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                            </Button>
                          ) : (
                            <Button
                              type="submit"
                              className="flex-1 h-10 text-[13px] font-medium rounded-full"
                              disabled={isLoading}
                              data-testid="btn-submit-auth"
                            >
                              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                                <>
                                  Create Account
                                  <Check className="h-3.5 w-3.5 ml-1.5" />
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </form>

                  <div className="mt-5 text-center">
                    <p className="text-[12px] text-muted-foreground/60">
                      {mode === 'login' ? (
                        <>
                          New here?{' '}
                          <button onClick={switchToRegister} className="text-primary font-medium hover:underline" data-testid="link-switch-register">
                            Create account
                          </button>
                        </>
                      ) : (
                        <>
                          Have an account?{' '}
                          <button onClick={switchToLogin} className="text-primary font-medium hover:underline" data-testid="link-switch-login">
                            Sign in
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
