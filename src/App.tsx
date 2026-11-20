import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Compass, FileText, Home, LogOut, MapPin, PlusCircle, Shield } from 'lucide-react';
import { api, getStoredToken, setStoredToken } from './api';
import { CivicLogo } from './components/CivicBrand';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { CitizenHomePage } from './pages/CitizenHomePage';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { ExploreMapPage } from './pages/ExploreMapPage';
import { MyReportsPage } from './pages/MyReportsPage';
import { CivicPulsePage } from './pages/CivicPulsePage';
import { AuthorityDashboardPage } from './pages/AuthorityDashboardPage';
import { IssueDetailsPage } from './pages/IssueDetailsPage';
import type { CivicReport, UserProfile } from './types';

type AppView =
  | 'landing'
  | 'auth'
  | 'home'
  | 'report'
  | 'explore'
  | 'my-reports'
  | 'pulse'
  | 'authority'
  | 'issue';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [prevView, setPrevView] = useState<AppView>('landing');
  const [reportMode, setReportMode] = useState<'photo' | 'voice'>('photo');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [selectedRelated, setSelectedRelated] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReports = useCallback(async () => {
    try {
      const res = await api.getReports();
      setReports(res.reports);
    } catch {
      // Keep current list on transient network error
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      const token = getStoredToken();
      const tasks: Array<Promise<void>> = [
        api.getReports().then((res) => {
          if (active) setReports(res.reports);
        }),
      ];
      if (token) {
        tasks.push(
          api
            .me()
            .then((res) => {
              if (active) {
                setUser(res.user);
                setView(res.user.role === 'authority' ? 'authority' : 'home');
              }
            })
            .catch(() => {
              setStoredToken(null);
            })
        );
      }
      await Promise.all(tasks);
      if (active) setLoading(false);
    }
    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const navigateTo = (next: AppView, mode?: 'photo' | 'voice') => {
    if (mode) setReportMode(mode);
    setPrevView(view);
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inspectReport = async (reportId: string) => {
    setPrevView(view);
    setSelectedReportId(reportId);
    setView('issue');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      const detail = await api.getReport(reportId);
      setReports((prev) => prev.map((r) => (r.id === detail.report.id ? detail.report : r)));
      setSelectedRelated(detail.relatedReports);
    } catch {
      setSelectedRelated([]);
    }
  };

  const handleAuthSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    navigateTo(loggedInUser.role === 'authority' ? 'authority' : 'home');
  };

  const handleSignOut = () => {
    setStoredToken(null);
    setUser(null);
    navigateTo('landing');
  };

  const handleReportCreated = (created: CivicReport) => {
    setReports((prev) => [created, ...prev]);
    inspectReport(created.id);
  };

  const handleReportUpdated = (updated: CivicReport) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleQuickConfirm = async (reportId: string, type: 'still_exists' | 'confirm_resolved') => {
    const res = await api.validateReport(reportId, { type });
    handleReportUpdated(res.report);
  };

  const inspectedReport =
    selectedReportId ? reports.find((r) => r.id === selectedReportId) || reports[0] : null;

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
      active
        ? 'text-[#202C2A] border-[#246B61]'
        : 'text-[#77827E] border-transparent hover:text-[#202C2A]'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#202C2A]">
      {/* Strict 3-Zone Top Bar */}
      <header className="sticky top-0 z-40 h-14 md:h-16 border-b border-[#E7ECE8] bg-white/95 backdrop-blur-xs">
        <div className="mx-auto max-w-[1280px] h-full px-5 md:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element Brand */}
          <button
            type="button"
            onClick={() => navigateTo(user ? (user.role === 'authority' ? 'authority' : 'home') : 'landing')}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#246B61] rounded-md"
          >
            <CivicLogo />
          </button>

          {/* Zone 2: 4-5 Concise Single-Line Links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Primary navigation">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('home')}
                  className={navLinkClass(view === 'home')}
                >
                  Home
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('explore')}
                  className={navLinkClass(view === 'explore')}
                >
                  Explore Map
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('pulse')}
                  className={navLinkClass(view === 'pulse')}
                >
                  CivicPulse
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('my-reports')}
                  className={navLinkClass(view === 'my-reports')}
                >
                  My Reports
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('authority')}
                  className={navLinkClass(view === 'authority')}
                >
                  Authority
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigateTo('landing')}
                  className={navLinkClass(view === 'landing')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('explore')}
                  className={navLinkClass(view === 'explore')}
                >
                  Explore Map
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('pulse')}
                  className={navLinkClass(view === 'pulse')}
                >
                  CivicPulse
                </button>
                <button
                  type="button"
                  onClick={() => navigateTo('authority')}
                  className={navLinkClass(view === 'authority')}
                >
                  Authority
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => navigateTo('report', 'photo')}
                className="rounded-lg bg-[#246B61] px-4 py-2 text-xs font-medium text-white hover:bg-[#194B45] transition-colors whitespace-nowrap shrink-0"
              >
                Report Issue
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className="rounded-lg bg-[#246B61] px-4 py-2 text-xs font-medium text-white hover:bg-[#194B45] transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Signed-in quiet workspace bar (below header, outside 3-zone top bar) */}
      {user && (
        <div className="border-b border-[#E7ECE8] bg-[#F6F8F6] px-5 md:px-6 py-2">
          <div className="mx-auto max-w-[1280px] flex flex-wrap items-center justify-between gap-2 text-xs text-[#77827E]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[#202C2A]">{user.name}</span>
              <span aria-hidden="true">·</span>
              <span>{user.role === 'authority' ? 'Municipal Authority' : 'Citizen'}</span>
              <span aria-hidden="true">·</span>
              <span>{user.ward}</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigateTo('auth')}
                className="hover:text-[#202C2A] transition-colors"
              >
                Switch role
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 hover:text-[#202C2A] transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 pb-20 md:pb-8">
        {loading && reports.length === 0 ? (
          <div className="mx-auto max-w-[1200px] px-6 py-16 space-y-4">
            <div className="h-8 w-64 rounded bg-[#F0F4F1] animate-pulse" />
            <div className="h-64 w-full rounded-xl bg-[#F6F8F6] animate-pulse" />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view}-${selectedReportId || ''}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              {view === 'landing' && (
                <LandingPage
                  reports={reports}
                  onNavigate={(target) => navigateTo(target)}
                  onInspectReport={inspectReport}
                />
              )}

              {view === 'auth' && <AuthPage onSuccess={handleAuthSuccess} />}

              {view === 'home' &&
                (user ? (
                  <CitizenHomePage
                    user={user}
                    reports={reports}
                    onNavigate={(target, mode) => navigateTo(target, mode)}
                    onInspectReport={inspectReport}
                    onQuickConfirm={handleQuickConfirm}
                  />
                ) : (
                  <AuthPage onSuccess={handleAuthSuccess} />
                ))}

              {view === 'report' && (
                <ReportIssuePage
                  user={user}
                  initialMode={reportMode}
                  reports={reports}
                  onRequireAuth={() => navigateTo('auth')}
                  onReportCreated={handleReportCreated}
                  onInspectReport={inspectReport}
                />
              )}

              {view === 'explore' && (
                <ExploreMapPage reports={reports} onInspectReport={inspectReport} />
              )}

              {view === 'my-reports' &&
                (user ? (
                  <MyReportsPage
                    user={user}
                    reports={reports}
                    onInspectReport={inspectReport}
                    onStartReport={() => navigateTo('report', 'photo')}
                  />
                ) : (
                  <AuthPage onSuccess={handleAuthSuccess} />
                ))}

              {view === 'pulse' && (
                <CivicPulsePage reports={reports} onInspectReport={inspectReport} />
              )}

              {view === 'authority' && (
                <AuthorityDashboardPage
                  user={user}
                  reports={reports}
                  onRequireAuth={() => navigateTo('auth')}
                  onInspectReport={inspectReport}
                  onReportsChanged={(updated) => {
                    handleReportUpdated(updated);
                    loadReports();
                  }}
                />
              )}

              {view === 'issue' && inspectedReport && (
                <IssueDetailsPage
                  report={inspectedReport}
                  relatedReports={selectedRelated}
                  user={user}
                  onBack={() =>
                    navigateTo(
                      prevView && prevView !== 'issue'
                        ? prevView
                        : user
                        ? 'home'
                        : 'explore'
                    )
                  }
                  onRequireAuth={() => navigateTo('auth')}
                  onReportUpdated={handleReportUpdated}
                  onInspectReport={inspectReport}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Mobile Thumb Navigation (56px height, keeps total sticky header+footer <= 15% viewport) */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 h-14 border-t border-[#E7ECE8] bg-white grid grid-cols-5"
      >
        <button
          type="button"
          onClick={() => navigateTo(user ? 'home' : 'landing')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            view === 'home' || view === 'landing' ? 'text-[#246B61]' : 'text-[#77827E]'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo('explore')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            view === 'explore' ? 'text-[#246B61]' : 'text-[#77827E]'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Radar</span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo('report', 'photo')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            view === 'report' ? 'text-[#246B61]' : 'text-[#202C2A]'
          }`}
        >
          <PlusCircle className="w-5 h-5 text-[#246B61]" />
          <span>Report</span>
        </button>
        <button
          type="button"
          onClick={() => navigateTo('pulse')}
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            view === 'pulse' ? 'text-[#246B61]' : 'text-[#77827E]'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Pulse</span>
        </button>
        <button
          type="button"
          onClick={() =>
            navigateTo(user?.role === 'authority' ? 'authority' : user ? 'my-reports' : 'auth')
          }
          className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium ${
            view === 'my-reports' || view === 'authority' || view === 'auth'
              ? 'text-[#246B61]'
              : 'text-[#77827E]'
          }`}
        >
          {user?.role === 'authority' ? (
            <Shield className="w-4 h-4" />
          ) : (
            <FileText className="w-4 h-4" />
          )}
          <span>{user?.role === 'authority' ? 'Command' : user ? 'Mine' : 'Account'}</span>
        </button>
      </nav>
    </div>
  );
}
