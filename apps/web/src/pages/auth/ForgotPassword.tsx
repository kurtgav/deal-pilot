import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../hooks/useAuth';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset email.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout
        title="Check your inbox"
        subtitle={`If an account exists for ${email}, we sent a reset link.`}
        footer={
          <Link to="/login" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700 transition-colors">
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center text-center py-4 gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
            <Mail className="text-indigo-500" size={22} />
          </div>
          <p className="text-[13px] text-zinc-500 leading-relaxed">
            The link expires shortly. Check your spam folder if you don&apos;t see it.
          </p>
          <button
            onClick={() => setSent(false)}
            className="text-[13px] text-indigo-600 hover:text-indigo-500 font-medium transition-colors"
          >
            Try a different email
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700 transition-colors">
          <ArrowLeft size={13} />
          Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-zinc-700 mb-1.5">Email</label>
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
              Sending…
            </span>
          ) : (
            'Send reset link'
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
