import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

export default function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const passwordStrength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;
  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][passwordStrength];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400'][passwordStrength];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setIsSubmitting(true);
    try {
      await signUp(email, password);
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate('/app', { replace: true });
      else setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (emailSent) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`We sent a confirmation link to ${email}.`}
        footer={
          <>
            Already confirmed?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
              Sign in
            </Link>
          </>
        }
      >
        <div className="flex flex-col items-center text-center py-4 gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-500" size={24} />
          </div>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            Click the link in the email to activate your account. Check your spam folder if you don&apos;t see it.
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="text-[13px] text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            Use a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start qualifying leads smarter, today."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-500 font-medium transition-colors">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">Work email</label>
          <input
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-[14px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 transition-all"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full h-10 px-3.5 pr-10 rounded-lg border border-zinc-200 bg-zinc-50 text-[14px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {password.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex gap-1 flex-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${i <= passwordStrength ? strengthColor : 'bg-zinc-100'}`}
                  />
                ))}
              </div>
              <span className="text-[11px] text-zinc-400">{strengthLabel}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">Confirm password</label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            className="w-full h-10 px-3.5 rounded-lg border border-zinc-200 bg-zinc-50 text-[14px] text-zinc-900 placeholder:text-zinc-400 outline-none focus:bg-white focus:border-indigo-400 focus:ring-3 focus:ring-indigo-100 transition-all"
          />
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-100 px-3.5 py-2.5 text-[13px] text-red-700">
            <span className="mt-0.5 shrink-0">⚠</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-lg bg-zinc-900 text-white text-[14px] font-medium hover:bg-zinc-800 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating account…
            </span>
          ) : (
            'Create account'
          )}
        </button>

        <p className="text-center text-[12px] text-zinc-400">
          By creating an account you agree to our{' '}
          <a href="#" className="underline underline-offset-2 hover:text-zinc-600 transition-colors">Terms</a>
          {' '}and{' '}
          <a href="#" className="underline underline-offset-2 hover:text-zinc-600 transition-colors">Privacy Policy</a>.
        </p>
      </form>
    </AuthLayout>
  );
}
