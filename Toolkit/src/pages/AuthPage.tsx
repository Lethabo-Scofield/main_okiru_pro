import { useState, useEffect } from "react";
import { useAuth } from "@toolkit/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@toolkit/components/ui/card";
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

interface OrgOption {
  id: string;
  name: string;
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6" data-testid="step-indicator">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`
                h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300
                ${isDone
                  ? "bg-primary text-primary-foreground"
                  : isActive
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
                    : "bg-muted text-muted-foreground/50"
                }
              `}
              data-testid={`step-dot-${step}`}
            >
              {isDone ? <Check className="h-3.5 w-3.5" /> : step}
            </div>
            {step < total && (
              <div className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${isDone ? "bg-primary" : "bg-muted"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

const stepLabels = ["Organization", "Your Details", "Credentials", "Role"];
const stepIcons = [Building2, User, KeyRound, Shield];

export default function AuthPage({ defaultMode = 'login' }: { defaultMode?: 'login' | 'register' } = {}) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const { login, register } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
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

  const validateStep = (s: number): boolean => {
    const errors: Record<string, string> = {};

    if (s === 1) {
      if (!form.organizationId) errors.organizationId = "Please select your organization";
      if (!form.subscriptionId.trim()) errors.subscriptionId = "Subscription ID is required";
    } else if (s === 2) {
      if (!form.fullName.trim()) errors.fullName = "Full name is required";
      if (!form.email.trim()) errors.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Enter a valid email address";
    } else if (s === 3) {
      if (!form.username.trim()) errors.username = "Username is required";
      else if (form.username.length < 3) errors.username = "Username must be at least 3 characters";
      if (!form.password) errors.password = "Password is required";
      else if (form.password.length < 4) errors.password = "Password must be at least 4 characters";
      if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match";
    } else if (s === 4) {
      if (!form.role) errors.role = "Please select a role";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step) && step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setFieldErrors({});
      setStep(step - 1);
    }
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
    if (step < TOTAL_STEPS) {
      nextStep();
      return;
    }

    setIsLoading(true);
    try {
      await register({
        username: form.username,
        password: form.password,
        fullName: form.fullName,
        email: form.email,
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

  const switchToRegister = () => {
    setMode('register');
    setStep(1);
    setFieldErrors({});
  };

  const switchToLogin = () => {
    setMode('login');
    setStep(1);
    setFieldErrors({});
  };

  const selectedOrg = organizations.find(o => o.id === form.organizationId);
  const StepIcon = stepIcons[(step - 1) % stepIcons.length];

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -60 : 60, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);

  const goNext = () => { setDirection(1); nextStep(); };
  const goPrev = () => { setDirection(-1); prevStep(); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[400px]"
      >
        <div className="flex justify-center mb-8">
          <img src={okiruLogo} alt="Okiru" className="h-14 w-14 rounded-full object-contain" data-testid="img-logo-auth" />
        </div>

        <Card className="border border-border/50 shadow-none bg-card">
          <CardHeader className="text-center space-y-1 pt-8 pb-2">
            <CardTitle className="text-lg font-heading font-semibold tracking-tight" data-testid="text-auth-title">
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-[13px] text-muted-foreground/60">
              {mode === 'login'
                ? 'Access your compliance dashboard'
                : (
                  <span className="flex items-center justify-center gap-1.5">
                    <StepIcon className="h-3.5 w-3.5" />
                    {stepLabels[step - 1]}
                    <span className="text-muted-foreground/40">— Step {step} of {TOTAL_STEPS}</span>
                  </span>
                )
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-7">
            {mode === 'register' && (
              <StepIndicator current={step} total={TOTAL_STEPS} />
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'login' ? (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="username" className="text-[12px] font-medium text-muted-foreground/70">Username or Email</Label>
                    <Input
                      id="username"
                      required
                      value={form.username}
                      onChange={e => setForm({ ...form, username: e.target.value })}
                      placeholder="username or email"
                      className="h-9"
                      data-testid="input-username"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-[12px] font-medium text-muted-foreground/70">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      placeholder="••••••••"
                      className="h-9"
                      data-testid="input-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-9 text-[13px] font-medium mt-1 rounded-full"
                    disabled={isLoading}
                    data-testid="btn-submit-auth"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Continue'}
                  </Button>
                </>
              ) : (
                <div className="min-h-[200px]">
                  <AnimatePresence mode="wait" custom={direction}>
                    {step === 1 && (
                      <motion.div
                        key="step-1"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="space-y-4"
                      >
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
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-lg border border-primary/20 bg-primary/5 p-3"
                          >
                            <p className="text-[11px] text-primary font-medium mb-1">
                              {selectedOrg.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Enter the subscription ID provided by your organization to continue.
                            </p>
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
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step-2"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="space-y-4"
                      >
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
                            data-testid="input-fullname"
                          />
                          {fieldErrors.fullName && (
                            <p className="text-[11px] text-destructive" data-testid="error-fullname">{fieldErrors.fullName}</p>
                          )}
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-[12px] font-medium text-muted-foreground/70">Email Address</Label>
                          <Input
                            type="email"
                            value={form.email}
                            onChange={e => {
                              setForm({ ...form, email: e.target.value });
                              setFieldErrors(prev => ({ ...prev, email: '' }));
                            }}
                            placeholder="thabo@company.co.za"
                            className="h-10"
                            data-testid="input-email"
                          />
                          {fieldErrors.email && (
                            <p className="text-[11px] text-destructive" data-testid="error-email">{fieldErrors.email}</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 3 && (
                      <motion.div
                        key="step-3"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="space-y-4"
                      >
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
                            data-testid="input-confirm-password"
                          />
                          {fieldErrors.confirmPassword && (
                            <p className="text-[11px] text-destructive" data-testid="error-confirm-password">{fieldErrors.confirmPassword}</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 4 && (
                      <motion.div
                        key="step-4"
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="space-y-4"
                      >
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
                                className={`
                                  w-full text-left rounded-lg border p-3 transition-all
                                  ${form.role === r.value
                                    ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                    : "border-border/50 hover:border-border hover:bg-muted/30"
                                  }
                                `}
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
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                            <span className="text-muted-foreground/60">Organization</span>
                            <span className="text-foreground font-medium truncate">{selectedOrg?.name || '—'}</span>
                            <span className="text-muted-foreground/60">Name</span>
                            <span className="text-foreground font-medium truncate">{form.fullName || '—'}</span>
                            <span className="text-muted-foreground/60">Email</span>
                            <span className="text-foreground font-medium truncate">{form.email || '—'}</span>
                            <span className="text-muted-foreground/60">Username</span>
                            <span className="text-foreground font-medium truncate">{form.username || '—'}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex gap-2 pt-3">
                    {step > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goPrev}
                        className="h-9 text-[13px] rounded-full px-4"
                        data-testid="btn-prev-step"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                        Back
                      </Button>
                    )}
                    {step < TOTAL_STEPS ? (
                      <Button
                        type="button"
                        onClick={() => { setDirection(1); if (validateStep(step)) setStep(step + 1); }}
                        className="flex-1 h-9 text-[13px] font-medium rounded-full"
                        data-testid="btn-next-step"
                      >
                        Continue
                        <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="flex-1 h-9 text-[13px] font-medium rounded-full"
                        disabled={isLoading}
                        data-testid="btn-submit-auth"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                          <>
                            Create Account
                            <Check className="h-3.5 w-3.5 ml-1" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </form>

            <div className="mt-4 text-center">
              <p className="text-[12px] text-muted-foreground/60">
                {mode === 'login' ? (
                  <>
                    New here?{' '}
                    <button
                      onClick={switchToRegister}
                      className="text-primary font-medium hover:underline"
                      data-testid="link-switch-register"
                    >
                      Create account
                    </button>
                  </>
                ) : (
                  <>
                    Have an account?{' '}
                    <button
                      onClick={switchToLogin}
                      className="text-primary font-medium hover:underline"
                      data-testid="link-switch-login"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
