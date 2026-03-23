import { useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { Wallet } from 'lucide-react';

interface Props { onSwitch: () => void; }

function AuthBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0f1e38 50%, #071020 100%)' }}>
      <svg
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.18 }}
      >
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#3b82f6" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <polyline
          points="0,420 120,380 200,395 300,340 420,310 520,280 620,260 720,230 820,210 920,190 1100,160 1300,140 1500,120"
          fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round"
        />
        <polyline
          points="0,600 150,560 260,580 380,520 480,490 600,470 700,450 850,420 1000,400 1200,370 1400,350 1600,320"
          fill="none" stroke="#60a5fa" strokeWidth="1.5" strokeLinejoin="round"
        />
        <polyline
          points="0,200 100,220 220,215 350,240 460,260 580,250 700,275 850,290 1000,310 1200,330"
          fill="none" stroke="#818cf8" strokeWidth="1" strokeLinejoin="round"
        />
        {[80,160,240,320,400,480,560,640,720,800,880,960,1040,1120,1200].map((x, i) => (
          <rect key={x} x={x} y={500 - (i % 5) * 30 - 40} width="28" height={(i % 5) * 30 + 40} fill="#2563eb" opacity="0.15" />
        ))}
        {[100,180,260,340,420,500,580,660,740,820,900].map((x, i) => (
          <g key={x}>
            <line x1={x + 10} y1={300 - i * 8} x2={x + 10} y2={370 - i * 5} stroke="#60a5fa" strokeWidth="1" opacity="0.4" />
            <rect x={x + 5} y={320 - i * 7} width="10" height="20" fill="#3b82f6" opacity="0.3" />
          </g>
        ))}
      </svg>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(10,15,30,0.3) 0%, rgba(5,8,18,0.85) 70%, rgba(3,5,12,0.97) 100%)',
      }} />
    </div>
  );
}

export default function Signup({ onSwitch }: Props) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) setError(error.message);
    else setSuccess(true);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <AuthBackground />

      <div className="relative z-10 w-full max-w-sm" style={{ background: 'rgba(255,255,255,0.97)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}>
        <div className="h-1 w-full bg-[#2563eb]" />

        <div className="p-8">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#1e2535] p-2">
              <Wallet size={16} className="text-white" />
            </div>
            <div>
              <p className="text-[#111827] font-semibold text-sm leading-none tracking-tight">FinanceOS</p>
              <p className="text-[#9ca3af] text-xs mt-0.5">Personal Finance Platform</p>
            </div>
          </div>

          {success ? (
            <div className="text-center py-4">
              <p className="text-[#111827] font-semibold mb-2">Check your email</p>
              <p className="text-[#6b7280] text-sm mb-6 leading-relaxed">
                A confirmation link was sent to <strong>{email}</strong>. Click it to activate your account.
              </p>
              <button onClick={onSwitch} className="text-[#2563eb] text-sm hover:underline font-medium">
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-[#111827] text-xl font-semibold mb-1 tracking-tight">Create account</h1>
              <p className="text-[#6b7280] text-sm mb-6">Free to use. Your data stays yours.</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-widest">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full border border-[#dde2ee] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] transition-colors"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-widest">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full border border-[#dde2ee] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] transition-colors"
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-widest">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full border border-[#dde2ee] bg-[#f8fafc] px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:border-[#2563eb] transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e2535] text-white text-sm font-medium py-2.5 hover:bg-[#2d3f5a] disabled:opacity-50 transition-colors mt-2"
                >
                  {loading ? 'Creating account…' : 'Create account'}
                </button>
              </form>

              <p className="text-center text-sm text-[#6b7280] mt-6">
                Already have an account?{' '}
                <button onClick={onSwitch} className="text-[#2563eb] hover:underline font-semibold">
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
