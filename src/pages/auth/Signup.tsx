import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet } from 'lucide-react';

interface Props { onSwitch: () => void; }

export default function Signup({ onSwitch }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#eef0f6] flex items-center justify-center p-4">
      <div className="bg-white border border-[#dde3ef] shadow-sm w-full max-w-sm p-8">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#1e2839] p-2">
            <Wallet size={18} className="text-white" />
          </div>
          <div>
            <p className="text-[#111827] font-semibold text-sm leading-none">FinanceOS</p>
            <p className="text-[#9ca3af] text-xs mt-0.5">Personal Finance Platform</p>
          </div>
        </div>

        {success ? (
          <div className="text-center py-4">
            <p className="text-[#111827] font-semibold mb-2">Check your email</p>
            <p className="text-[#6b7280] text-sm mb-6">
              We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
            </p>
            <button onClick={onSwitch} className="text-[#2563eb] text-sm hover:underline">
              Back to sign in
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-[#111827] text-lg font-semibold mb-1">Create account</h1>
            <p className="text-[#6b7280] text-sm mb-6">Free to use. Your data stays yours.</p>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-[#dde3ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] transition-colors"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5 uppercase tracking-wide">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full border border-[#dde3ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] transition-colors"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#374151] mb-1.5 uppercase tracking-wide">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="w-full border border-[#dde3ef] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] transition-colors"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1e2839] text-white text-sm font-medium py-2.5 hover:bg-[#2d3f5a] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="text-center text-sm text-[#6b7280] mt-6">
              Already have an account?{' '}
              <button onClick={onSwitch} className="text-[#2563eb] hover:underline font-medium">
                Sign in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
