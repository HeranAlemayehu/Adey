import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Heart, ArrowLeft } from 'lucide-react';

// Step 1 schema - Personal information
const step1Schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  isPregnant: z.string().refine((val) => val === 'yes' || val === 'no', {
    message: 'Please select an option',
  }),
  lastMenstrualCycle: z.string().optional(),
}).refine((data) => {
  if (data.isPregnant === 'yes' && !data.lastMenstrualCycle) {
    return false;
  }
  return true;
}, {
  message: 'Last menstrual cycle is required for pregnant users',
  path: ['lastMenstrualCycle'],
});

// Step 2 schema - Medical conditions
const step2Schema = z.object({
  medicalConditions: z.array(z.string()).optional().default([]),
  otherCondition: z.string().optional(),
});

// Step 3 schema - Account credentials
const step3Schema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(72),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Login schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type LoginData = z.infer<typeof loginSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [signupStep, setSignupStep] = useState(1);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step2Data, setStep2Data] = useState<Step2Data | null>(null);
  const [loading, setLoading] = useState(false);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      isPregnant: undefined,
    },
  });

  const step2Form = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      medicalConditions: [] as string[],
      otherCondition: '',
    },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
  });

  const loginForm = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const handleLogin = async (data: LoginData) => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStep1Submit = async (data: Step1Data) => {
    setStep1Data(data);
    setSignupStep(2);
  };

  const handleStep2Submit = async (data: Step2Data) => {
    setStep2Data(data);
    setSignupStep(3);
  };

  const handleStep3Submit = async (data: Step3Data) => {
    if (!step1Data || !step2Data) return;
    
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      // Sign up the user
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: step1Data.name,
            date_of_birth: step1Data.dateOfBirth,
          }
        }
      });

      if (signupError) throw signupError;
      if (!authData.user) throw new Error('Signup failed');

      // Calculate age from date of birth
      const dob = new Date(step1Data.dateOfBirth);
      const age = Math.floor((new Date().getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

      // Prepare medical conditions
      const medicalConditions = [...step2Data.medicalConditions];
      if (step2Data.otherCondition?.trim()) {
        medicalConditions.push(`Other: ${step2Data.otherCondition.trim()}`);
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          name: step1Data.name,
          age: age,
          medical_conditions: medicalConditions,
        });

      if (profileError) console.error('Error saving profile:', profileError);

      // If pregnant, calculate pregnancy info
      if (step1Data.isPregnant === 'yes' && step1Data.lastMenstrualCycle) {
        const lmpDate = new Date(step1Data.lastMenstrualCycle);
        const pregnancyStartDate = new Date(lmpDate);
        const dueDate = new Date(lmpDate);
        dueDate.setDate(dueDate.getDate() + 280); // 40 weeks

        // Insert pregnancy info
        const { error: pregnancyError } = await supabase
          .from('pregnancy_info')
          .insert({
            user_id: authData.user.id,
            pregnancy_start_date: pregnancyStartDate.toISOString().split('T')[0],
            due_date: dueDate.toISOString().split('T')[0],
          });

        if (pregnancyError) console.error('Error saving pregnancy info:', pregnancyError);
      }

      // Create user settings
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: authData.user.id,
          temperature_unit: 'celsius',
          notifications_enabled: true,
          emergency_monitoring_enabled: true,
        });

      if (settingsError) console.error('Error creating settings:', settingsError);

      toast.success('Account created successfully!');
      
      // Redirect directly to home
      navigate('/');
    } catch (error: any) {
      if (error.message.includes('already registered')) {
        toast.error('This email is already registered. Please login instead.');
      } else {
        toast.error(error.message || 'Signup failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToStep1 = () => {
    setSignupStep(1);
  };

  const handleBackToStep2 = () => {
    setSignupStep(2);
  };

  const toggleCondition = (condition: string) => {
    const current = step2Form.getValues('medicalConditions');
    if (current.includes(condition)) {
      step2Form.setValue('medicalConditions', current.filter(c => c !== condition));
    } else {
      step2Form.setValue('medicalConditions', [...current, condition]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md p-8 rounded-3xl border-2 bg-card shadow-card">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Heart className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-center text-foreground mb-2">
          {isLogin 
            ? 'Welcome Back' 
            : signupStep === 1 
            ? 'Personal Information' 
            : signupStep === 2 
            ? 'Medical History' 
            : 'Create Your Account'}
        </h1>
        <p className="text-center text-muted-foreground mb-8">
          {isLogin 
            ? 'Sign in to continue' 
            : signupStep === 1 
            ? 'Tell us about yourself' 
            : signupStep === 2 
            ? 'Help us understand your health needs' 
            : 'Set up your login credentials'}
        </p>

        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <Label htmlFor="login-email" className="text-foreground">Email</Label>
              <Input
                id="login-email"
                type="email"
                {...loginForm.register('email')}
                className="mt-1 rounded-full"
                placeholder="your@email.com"
              />
              {loginForm.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="login-password" className="text-foreground">Password</Label>
              <Input
                id="login-password"
                type="password"
                {...loginForm.register('password')}
                className="mt-1 rounded-full"
                placeholder="••••••••"
              />
              {loginForm.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Sign In'}
            </Button>
          </form>
        ) : signupStep === 1 ? (
          <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <Input
                id="name"
                {...step1Form.register('name')}
                className="mt-1 rounded-full"
                placeholder="Jane Doe"
              />
              {step1Form.formState.errors.name && (
                <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dob" className="text-foreground">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                {...step1Form.register('dateOfBirth')}
                className="mt-1 rounded-full"
              />
              {step1Form.formState.errors.dateOfBirth && (
                <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="pregnant" className="text-foreground">Are you pregnant?</Label>
              <Select onValueChange={(value) => step1Form.setValue('isPregnant', value as 'yes' | 'no')}>
                <SelectTrigger className="mt-1 rounded-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
              {step1Form.formState.errors.isPregnant && (
                <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.isPregnant.message}</p>
              )}
            </div>

            {step1Form.watch('isPregnant') === 'yes' && (
              <div>
                <Label htmlFor="lmp" className="text-foreground">Last Menstrual Cycle Date</Label>
                <Input
                  id="lmp"
                  type="date"
                  {...step1Form.register('lastMenstrualCycle')}
                  className="mt-1 rounded-full"
                />
                {step1Form.formState.errors.lastMenstrualCycle && (
                  <p className="text-sm text-destructive mt-1">{step1Form.formState.errors.lastMenstrualCycle.message}</p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full rounded-full"
              size="lg"
            >
              Next
            </Button>
          </form>
        ) : signupStep === 2 ? (
          <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToStep1}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div>
              <Label className="text-foreground font-semibold">Do you have any pre-existing medical conditions?</Label>
              <p className="text-sm text-muted-foreground mb-3">Select all that apply</p>
              
              <div className="space-y-2">
                {['Hypertension', 'Preeclampsia', 'Diabetes', 'Asthma', 'Heart conditions', 'Previous miscarriage'].map((condition) => (
                  <label key={condition} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                    <input
                      type="checkbox"
                      checked={step2Form.watch('medicalConditions').includes(condition)}
                      onChange={() => toggleCondition(condition)}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-foreground">{condition}</span>
                  </label>
                ))}
                
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={step2Form.watch('medicalConditions').includes('Other')}
                    onChange={() => toggleCondition('Other')}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-foreground">Other (please specify)</span>
                </label>
                
                {step2Form.watch('medicalConditions').includes('Other') && (
                  <Input
                    {...step2Form.register('otherCondition')}
                    placeholder="Please specify other condition"
                    className="mt-2 rounded-full"
                  />
                )}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full rounded-full"
              size="lg"
            >
              Next
            </Button>
          </form>
        ) : (
          <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBackToStep2}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            <div>
              <Label htmlFor="signup-email" className="text-foreground">Email</Label>
              <Input
                id="signup-email"
                type="email"
                {...step3Form.register('email')}
                className="mt-1 rounded-full"
                placeholder="your@email.com"
              />
              {step3Form.formState.errors.email && (
                <p className="text-sm text-destructive mt-1">{step3Form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="signup-password" className="text-foreground">Password</Label>
              <Input
                id="signup-password"
                type="password"
                {...step3Form.register('password')}
                className="mt-1 rounded-full"
                placeholder="••••••••"
              />
              {step3Form.formState.errors.password && (
                <p className="text-sm text-destructive mt-1">{step3Form.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                {...step3Form.register('confirmPassword')}
                className="mt-1 rounded-full"
                placeholder="••••••••"
              />
              {step3Form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{step3Form.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full rounded-full"
              size="lg"
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setSignupStep(1);
              step1Form.reset();
              step2Form.reset();
            }}
            className="text-primary hover:underline text-sm"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </Card>
    </div>
  );
};

export default Auth;
