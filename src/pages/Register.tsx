import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, User, ArrowLeft, Stethoscope, Building2, Phone, CheckCircle2, XCircle } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";

type UserType = "locum" | "practice" | null;
type RegistrationStep = "select" | "details" | "verification";

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const initialType = searchParams.get("type") as UserType;
  const [selectedType, setSelectedType] = useState<UserType>(initialType);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>(initialType ? "details" : "select");
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    practiceName: "",
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    confirmPassword?: string;
    practiceName?: string;
    terms?: string;
  }>({});

  // Verification state
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  const passwordsMatch = useMemo(() => {
    return formData.password === formData.confirmPassword && formData.password.length > 0;
  }, [formData.password, formData.confirmPassword]);

  const isStep1Valid = useMemo(() => {
    const baseValid = passwordsMatch && termsAccepted && formData.name.trim() && formData.email.trim() && formData.phone.trim();
    if (selectedType === "practice") {
      return baseValid && formData.practiceName.trim();
    }
    return baseValid;
  }, [passwordsMatch, termsAccepted, formData.name, formData.email, formData.phone, formData.practiceName, selectedType]);

  const validateStep1 = () => {
    const newErrors: typeof errors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (selectedType === "practice" && !formData.practiceName.trim()) {
      newErrors.practiceName = "Practice name is required";
    }

    if (!termsAccepted) {
      newErrors.terms = "You must accept the Terms and Conditions";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep1()) return;

    try {
      // Send both OTPs
      const [emailRes, phoneRes] = await Promise.all([
        supabase.functions.invoke('send-registration-otp', {
          body: { identifier: formData.email, type: 'email' }
        }),
        supabase.functions.invoke('send-registration-otp', {
          body: { identifier: formData.phone, type: 'phone' }
        })
      ]);

      if (emailRes.error || phoneRes.error) {
        throw new Error(emailRes.error?.message || phoneRes.error?.message || 'Failed to send verification codes');
      }

      const emailCode = emailRes.data?.code;
      const phoneCode = phoneRes.data?.code;

      setCurrentStep("verification");
      toast({
        title: "Verification codes sent",
        description: `Codes: Email [${emailCode}] | Phone [${phoneCode}] (Development mode)`,
        duration: 20000, // Display longer for testing
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification codes. Please try again.",
        variant: "destructive",
      });
    }
  };


  const handleVerifyEmail = async () => {
    if (emailOtp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setVerifyingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-registration-otp', {
        body: { identifier: formData.email, type: 'email', code: emailOtp }
      });

      if (error) throw error;

      setEmailVerified(true);
      toast({
        title: "Email verified",
        description: "Your email has been verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code.",
        variant: "destructive",
      });
    } finally {
      setVerifyingEmail(false);
    }
  };


  const handleVerifyPhone = async () => {
    if (phoneOtp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setVerifyingPhone(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-registration-otp', {
        body: { identifier: formData.phone, type: 'phone', code: phoneOtp }
      });

      if (error) throw error;

      setPhoneVerified(true);
      toast({
        title: "Phone verified",
        description: "Your phone number has been verified successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired verification code.",
        variant: "destructive",
      });
    } finally {
      setVerifyingPhone(false);
    }
  };


  const handleCompleteRegistration = async () => {
    if (!emailVerified || !phoneVerified) {
      toast({
        title: "Verification required",
        description: "Please verify both your email and phone number.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) {
        toast({
          title: "Registration Failed",
          description: authError.message,
          variant: "destructive",
        });
        return;
      }

      if (authData.user) {
        // Create profile with user type
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          user_type: selectedType as "locum" | "practice",
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone,
          practice_name: selectedType === "practice" ? formData.practiceName : null,
        });

        if (profileError) {
          toast({
            title: "Profile Creation Failed",
            description: profileError.message,
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Registration Successful",
        description: `Your ${selectedType === "locum" ? "locum" : "practice"} account has been created!`,
      });
      navigate(selectedType === "locum" ? "/locum-dashboard" : "/practice-dashboard");
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSocialLogin = async (provider: "google") => {
    if (!selectedType) {
      toast({
        title: "Please select user type",
        description: "Choose whether you're registering as a Locum or Practice",
        variant: "destructive",
      });
      return;
    }

    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${baseUrl}/auth/callback?type=${selectedType}`,
      },
    });


    if (error) {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleResendCode = async (type: "email" | "phone") => {
    try {
      const identifier = type === "email" ? formData.email : formData.phone;
      const { data, error } = await supabase.functions.invoke('send-registration-otp', {
        body: { identifier, type }
      });

      if (error) throw error;

      const newCode = data?.code;

      toast({
        title: "Code resent",
        description: `A new verification code [${newCode}] has been sent to your ${type}.`,
        duration: 20000,
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to resend ${type} verification code.`,
        variant: "destructive",
      });
    }
  };


  // Role selection screen
  if (currentStep === "select") {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">
          <Button
            variant="ghost"
            asChild
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <Card className="shadow-lg border-border">
            <CardHeader className="text-center pb-4">
              <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-primary">
                  <span className="text-primary-foreground font-bold text-2xl">LT</span>
                </div>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Join Our Network</h1>
              <p className="text-muted-foreground">Choose how you'd like to register</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <Button
                variant="outline"
                className="w-full h-auto py-6 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => {
                  setSelectedType("locum");
                  setCurrentStep("details");
                }}
              >
                <Stethoscope className="w-8 h-8 text-primary" />
                <span className="text-lg font-semibold">Register as Locum</span>
                <span className="text-sm text-muted-foreground">For dental professionals seeking work</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-auto py-6 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => {
                  setSelectedType("practice");
                  setCurrentStep("details");
                }}
              >
                <Building2 className="w-8 h-8 text-primary" />
                <span className="text-lg font-semibold">Register as Practice</span>
                <span className="text-sm text-muted-foreground">For dental practices hiring locums</span>
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-4">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 2: Verification
  if (currentStep === "verification") {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Button
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
            onClick={() => setCurrentStep("details")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </Button>

          <Card className="shadow-lg border-border">
            <CardHeader className="text-center pb-2">
              <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-4">
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-primary">
                  <span className="text-primary-foreground font-bold text-2xl">LT</span>
                </div>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Verify Your Details</h1>
              <p className="text-muted-foreground">
                Complete verification to finish registration
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs text-muted-foreground">Step 2 of 2</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Email Verification */}
              <div className="space-y-3 p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Email Verification</span>
                  </div>
                  {emailVerified ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Not verified</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Code sent to {formData.email}
                </p>
                {!emailVerified && (
                  <>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={emailOtp}
                        onChange={setEmailOtp}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleResendCode("email")}
                      >
                        Resend Code
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleVerifyEmail}
                        disabled={verifyingEmail || emailOtp.length !== 6}
                      >
                        {verifyingEmail ? "Verifying..." : "Verify Email"}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Phone Verification */}
              <div className="space-y-3 p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Phone Verification</span>
                  </div>
                  {phoneVerified ? (
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-sm">Verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Not verified</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Code sent to {formData.phone}
                </p>
                {!phoneVerified && (
                  <>
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={phoneOtp}
                        onChange={setPhoneOtp}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleResendCode("phone")}
                      >
                        Resend Code
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={handleVerifyPhone}
                        disabled={verifyingPhone || phoneOtp.length !== 6}
                      >
                        {verifyingPhone ? "Verifying..." : "Verify Phone"}
                      </Button>
                    </div>
                  </>
                )}
              </div>

              <Button
                className="w-full shadow-primary"
                onClick={handleCompleteRegistration}
                disabled={!emailVerified || !phoneVerified}
              >
                Complete Registration
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign In
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Step 1: User Details
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => {
            setSelectedType(null);
            setCurrentStep("select");
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Change Registration Type
        </Button>

        <Card className="shadow-lg border-border">
          <CardHeader className="text-center pb-2">
            <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-4">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center shadow-primary">
                <span className="text-primary-foreground font-bold text-2xl">LT</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedType === "locum" ? "Register as Locum" : "Register as Practice"}
            </h1>
            <p className="text-muted-foreground">
              {selectedType === "locum" 
                ? "Join our dental locum network" 
                : "Find qualified dental professionals"}
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">Step 1 of 2</span>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleSocialLogin("google")}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Registration Form - Step 1 */}
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your full name"
                    className="pl-10"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="dentist@localtemp.co.uk"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+44 7XXX XXXXXX"
                    className="pl-10"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              {selectedType === "practice" && (
                <div className="space-y-2">
                  <Label htmlFor="practiceName">Practice Name</Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="practiceName"
                      type="text"
                      placeholder="Your dental practice name"
                      className="pl-10"
                      value={formData.practiceName}
                      onChange={(e) => setFormData({ ...formData, practiceName: e.target.value })}
                    />
                  </div>
                  {errors.practiceName && <p className="text-sm text-destructive">{errors.practiceName}</p>}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                {formData.confirmPassword && !passwordsMatch && (
                  <p className="text-sm text-destructive">Passwords do not match</p>
                )}
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="terms"
                    className="text-sm font-normal text-muted-foreground cursor-pointer"
                  >
                    I agree to the{" "}
                    <span className="text-primary hover:underline">Terms and Conditions</span>
                  </Label>
                </div>
              </div>
              {errors.terms && <p className="text-sm text-destructive">{errors.terms}</p>}

              <Button 
                type="submit" 
                className="w-full shadow-primary"
                disabled={!isStep1Valid}
              >
                Next
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
