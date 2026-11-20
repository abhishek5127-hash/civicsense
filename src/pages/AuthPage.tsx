import { useState, type FormEvent } from 'react';
import { ArrowRight, Building2, UserCheck } from 'lucide-react';
import { api, setStoredToken } from '../api';
import { WARDS } from '../components/CivicBrand';
import { HeroNeighborhoodIllustration } from '../components/CivicIllustrations';
import type { UserProfile, UserRole } from '../types';

interface AuthPageProps {
  onSuccess: (user: UserProfile) => void;
}

export function AuthPage({ onSuccess }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>('citizen');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ward, setWard] = useState(WARDS[0]);
  const [department, setDepartment] = useState('Municipal Operations Command');
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'hi'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp =
        mode === 'login'
          ? await api.login(email, password)
          : await api.signup({
              name,
              email,
              password,
              role,
              ward,
              preferredLanguage,
              department: role === 'authority' ? department : undefined,
            });
      setStoredToken(resp.token);
      onSuccess(resp.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate.');
    } finally {
      setLoading(false);
    }
  };

  const quickDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setError(null);
    setLoading(true);
    try {
      const resp = await api.login(demoEmail, demoPassword);
      setStoredToken(resp.token);
      onSuccess(resp.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Demo sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-white">
      <div className="mx-auto max-w-[1200px] px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
        {/* Left Calm Brand Panel */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-8">
          <div>
            <p className="text-xs font-medium text-[#246B61]">Verified Neighbourhood Access</p>
            <h1
              className="mt-3 font-display text-3xl font-semibold tracking-tight text-[#202C2A]"
              style={{ textWrap: 'balance' }}
            >
              One workspace for residents and municipal teams.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#77827E]">
              Verified resident accounts protect community validation against spam and link your updates to
              your home ward. Authority accounts unlock triage prioritization and resolution evidence
              verification.
            </p>
          </div>

          <div className="my-8 h-60 overflow-hidden rounded-lg border border-[#E7ECE8] bg-white">
            <HeroNeighborhoodIllustration />
          </div>

          <div className="border-t border-[#E7ECE8] pt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[#77827E]">
            <span>English & हिन्दी supported</span>
            <span aria-hidden="true">·</span>
            <span>Role-verified community safeguards</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-6 flex flex-col justify-center max-w-md w-full mx-auto">
          <div className="flex items-center gap-1 rounded-lg bg-[#F0F4F1] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                mode === 'login' ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                mode === 'signup' ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
              }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-[#202C2A] mb-1.5">Account role</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('citizen')}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        role === 'citizen'
                          ? 'border-[#246B61] bg-[#F0F4F1] text-[#194B45]'
                          : 'border-[#E7ECE8] bg-white text-[#77827E]'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Citizen</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('authority')}
                      className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                        role === 'authority'
                          ? 'border-[#246B61] bg-[#F0F4F1] text-[#194B45]'
                          : 'border-[#E7ECE8] bg-white text-[#77827E]'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Authority</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="auth-name" className="block text-xs font-medium text-[#202C2A] mb-1.5">
                    Full name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Aarav Kulkarni"
                    className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3.5 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-medium text-[#202C2A] mb-1.5">
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.in"
                className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3.5 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-medium text-[#202C2A] mb-1.5">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3.5 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
              />
            </div>

            {mode === 'signup' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="auth-ward" className="block text-xs font-medium text-[#202C2A] mb-1.5">
                    Home ward
                  </label>
                  <select
                    id="auth-ward"
                    value={ward}
                    onChange={(e) => setWard(e.target.value)}
                    className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                  >
                    {WARDS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="auth-lang" className="block text-xs font-medium text-[#202C2A] mb-1.5">
                    Voice language
                  </label>
                  <select
                    id="auth-lang"
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value as 'en' | 'hi')}
                    className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                  >
                    <option value="en">English</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'signup' && role === 'authority' && (
              <div>
                <label htmlFor="auth-dept" className="block text-xs font-medium text-[#202C2A] mb-1.5">
                  Municipal division
                </label>
                <input
                  id="auth-dept"
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3.5 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                />
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-xs text-[#B91C1C]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#246B61] px-4 py-3 text-sm font-medium text-white hover:bg-[#194B45] disabled:opacity-60 transition-colors"
            >
              <span>{loading ? 'Signing in...' : mode === 'login' ? 'Sign in to CivicSense' : 'Create CivicSense account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Instant Role Access for Testing Citizen & Authority Experiences */}
          <div className="mt-8 border-t border-[#E7ECE8] pt-6">
            <p className="text-xs font-medium text-[#77827E]">Quick role evaluation access</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => quickDemoLogin('ananya@civicsense.in', 'citizen123')}
                className="flex flex-col items-start rounded-lg border border-[#E7ECE8] bg-[#F6F8F6] px-3.5 py-2.5 text-left hover:border-[#246B61] transition-colors"
              >
                <span className="text-xs font-semibold text-[#202C2A]">Citizen Account</span>
                <span className="text-[11px] text-[#77827E]">Ananya · Ward 82</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => quickDemoLogin('authority@civicsense.in', 'authority123')}
                className="flex flex-col items-start rounded-lg border border-[#E7ECE8] bg-[#F6F8F6] px-3.5 py-2.5 text-left hover:border-[#246B61] transition-colors"
              >
                <span className="text-xs font-semibold text-[#202C2A]">Authority Officer</span>
                <span className="text-[11px] text-[#77827E]">Meera Krishnan, IAS</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
