import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ImagePlus,
  Loader2,
  MapPin,
  Mic,
  Sparkles,
  Square,
  Upload,
} from 'lucide-react';
import { api } from '../api';
import { CATEGORIES, WARDS, StatusText } from '../components/CivicBrand';
import { createSampleIssueImageDataUrl } from '../components/CivicIllustrations';
import { NeighbourhoodMap } from '../components/NeighbourhoodMap';
import type {
  CivicReport,
  DuplicateCandidate,
  IssueCategory,
  UrgencyLevel,
  UserProfile,
} from '../types';

interface ReportIssuePageProps {
  user: UserProfile | null;
  initialMode?: 'photo' | 'voice';
  reports: CivicReport[];
  onRequireAuth: () => void;
  onReportCreated: (report: CivicReport) => void;
  onInspectReport: (reportId: string) => void;
}

const SAMPLE_VOICE_PROMPTS = [
  {
    lang: 'hi' as const,
    label: 'Sample हिन्दी Report',
    text: 'इंदिरानगर 12वीं मेन रोड पर स्ट्रीट लाइट तीन दिन से बंद है और सड़क पर बड़ा गड्ढा भी है, रात में चलना बहुत मुश्किल हो रहा है।',
  },
  {
    lang: 'en' as const,
    label: 'Sample English Report',
    text: 'Overflowing green garbage bin outside CMH Road metro pillar 64 since yesterday morning, waste is blocking the pedestrian walkway.',
  },
];

export function ReportIssuePage({
  user,
  initialMode = 'photo',
  reports,
  onRequireAuth,
  onReportCreated,
  onInspectReport,
}: ReportIssuePageProps) {
  const [intakeMode, setIntakeMode] = useState<'photo' | 'voice'>(initialMode);
  const [imageData, setImageData] = useState<string | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IssueCategory>('Roads & Potholes');
  const [urgency, setUrgency] = useState<UrgencyLevel>('Medium');
  const [urgencyReason, setUrgencyReason] = useState('');
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [aiImageSummary, setAiImageSummary] = useState<string | null>(null);

  const [ward, setWard] = useState(user?.ward || WARDS[0]);
  const [address, setAddress] = useState('12th Main & 100 Feet Rd Junction, HAL 2nd Stage');
  const [mapCoords, setMapCoords] = useState({ x: 47, y: 43 });

  // Voice states
  const [voiceLang, setVoiceLang] = useState<'en' | 'hi' | 'mixed'>(
    user?.preferredLanguage === 'hi' ? 'hi' : 'en'
  );
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Duplicate Intelligence
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [linkedClusterId, setLinkedClusterId] = useState<string | undefined>(undefined);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setIntakeMode(initialMode);
  }, [initialMode]);

  // Automatic Duplicate Intelligence check when location/category/text updates
  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setCheckingDuplicates(true);
      api
        .checkDuplicates({
          title,
          description,
          category,
          mapX: mapCoords.x,
          mapY: mapCoords.y,
        })
        .then((res) => setDuplicates(res.candidates))
        .catch(() => {})
        .finally(() => setCheckingDuplicates(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [user, title, description, category, mapCoords.x, mapCoords.y]);

  const handlePhotoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImageData(dataUrl);
      setAiError(null);
    };
    reader.readAsDataURL(file);
  };

  const runSmartReport = async (overrideImage?: string) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    const targetImage = overrideImage ?? imageData;
    if (!targetImage && !notes.trim()) {
      setAiError('Upload a photo or add brief notes for SmartReport AI to analyze.');
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const { suggestion } = await api.analyzeSmartReport({
        imageData: targetImage,
        notes,
        address,
      });
      setCategory(suggestion.category);
      setTitle(suggestion.title);
      setDescription(suggestion.description);
      setMissingInfo(suggestion.missingInfo || []);
      setUrgency(suggestion.urgency);
      setUrgencyReason(suggestion.urgencyReason);
      setAiImageSummary(suggestion.imageSummary);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'SmartReport AI analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const loadSamplePhoto = async (kind: 'pothole' | 'streetlight' | 'waste') => {
    const dataUrl = createSampleIssueImageDataUrl(kind);
    setImageData(dataUrl);
    if (kind === 'pothole') {
      setMapCoords({ x: 47, y: 43 });
      setAddress('12th Main & 100 Feet Rd Junction, HAL 2nd Stage');
    } else if (kind === 'streetlight') {
      setMapCoords({ x: 60, y: 32 });
      setAddress('8th Cross Rd, Defence Colony Park Edge');
    } else {
      setMapCoords({ x: 36, y: 25 });
      setAddress('CMH Road Service Lane, Near Metro Pillar 64');
    }
    if (user) {
      await runSmartReport(dataUrl);
    }
  };

  const startVoiceRecording = async () => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setAiError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Audio = reader.result as string;
          await processVoicePayload({ audioData: base64Audio, mimeType: blob.type || 'audio/webm' });
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setAiError(
        'Microphone access unavailable in this browser context. You can type or dictate into the Hindi/English box below or load a sample voice prompt.'
      );
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const processVoicePayload = async (payload: {
    audioData?: string;
    mimeType?: string;
    transcriptText?: string;
  }) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const { result } = await api.processVoiceReport({
        ...payload,
        languageHint: voiceLang,
      });
      setTranscript(result.transcript);
      setDetectedLang(result.detectedLanguage);
      setCategory(result.category);
      setTitle(result.title);
      setDescription(result.description);
      setMissingInfo(result.missingInfo || []);
      setUrgency(result.urgency);
      setUrgencyReason(result.urgencyReason);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Voice transcription failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleConfirmExisting = async (reportId: string) => {
    if (!user) {
      onRequireAuth();
      return;
    }
    try {
      await api.validateReport(reportId, {
        type: 'still_exists',
        note: notes.trim() || 'Confirmed via Duplicate Intelligence during new report intake.',
        evidenceImage: imageData,
      });
      setConfirmMsg(`Added your confirmation to ${reportId} instead of creating a duplicate.`);
    } catch (err) {
      setConfirmMsg(err instanceof Error ? err.message : 'Could not add confirmation.');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const { report } = await api.createReport({
        title,
        description,
        category,
        urgency,
        urgencyReason,
        ward,
        address,
        mapX: mapCoords.x,
        mapY: mapCoords.y,
        imageData,
        languageReported: intakeMode === 'voice' ? voiceLang : 'en',
        originalTranscript: intakeMode === 'voice' ? transcript : undefined,
        linkedClusterId,
      });
      onReportCreated(report);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-8 lg:py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E7ECE8] pb-6">
        <div>
          <p className="text-xs font-medium text-[#246B61]">Citizen Intake</p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-[#202C2A]">
            Report a neighbourhood issue
          </h1>
          <p className="mt-1.5 text-sm text-[#77827E]">
            Use SmartReport AI with a street photo or speak naturally in Hindi or English. Review and edit
            every suggestion before submitting.
          </p>
        </div>

        {/* Mode Segmented Toggle */}
        <div className="flex items-center gap-1 rounded-lg bg-[#F0F4F1] p-1 shrink-0 self-start">
          <button
            type="button"
            onClick={() => setIntakeMode('photo')}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              intakeMode === 'photo' ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
            }`}
          >
            <ImagePlus className="w-3.5 h-3.5" />
            <span>Photo & SmartReport AI</span>
          </button>
          <button
            type="button"
            onClick={() => setIntakeMode('voice')}
            className={`inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap ${
              intakeMode === 'voice' ? 'bg-white text-[#202C2A] shadow-xs' : 'text-[#77827E] hover:text-[#202C2A]'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice (EN / हिन्दी)</span>
          </button>
        </div>
      </div>

      {!user && (
        <div className="mt-6 rounded-lg border border-[#A9C4B4] bg-[#F0F4F1] px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#194B45]">
            Sign in with a Citizen account to run SmartReport AI, voice transcription, and submit reports.
          </p>
          <button
            type="button"
            onClick={onRequireAuth}
            className="rounded-md bg-[#246B61] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#194B45]"
          >
            Sign in / Switch account
          </button>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Capture & Editable Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
          {intakeMode === 'photo' ? (
            <section className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-semibold text-[#202C2A]">
                  01. Upload photo for SmartReport AI
                </h2>
                <span className="text-xs text-[#77827E]">Editable before submit</span>
              </div>

              {imageData ? (
                <div className="relative overflow-hidden rounded-lg border border-[#E7ECE8] bg-white">
                  <img
                    src={imageData}
                    alt="Uploaded civic issue preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-56 object-cover"
                  />
                  <div className="p-3 border-t border-[#E7ECE8] flex flex-wrap items-center justify-between gap-2 bg-white">
                    <button
                      type="button"
                      onClick={() => runSmartReport()}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#246B61] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#194B45] disabled:opacity-60"
                    >
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>{aiLoading ? 'Analyzing photo...' : 'Analyze with SmartReport AI'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageData(undefined)}
                      className="text-xs text-[#77827E] hover:text-[#202C2A]"
                    >
                      Remove photo
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#A9C4B4] bg-white px-6 py-8 text-center cursor-pointer hover:bg-[#F0F4F1]/50 transition-colors">
                  <Upload className="w-6 h-6 text-[#246B61]" />
                  <span className="mt-2 text-sm font-medium text-[#202C2A]">
                    Select a street photograph from your device
                  </span>
                  <span className="mt-1 text-xs text-[#77827E]">PNG, JPG, or WebP</span>
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="sr-only" />
                </label>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-[#77827E]">Or test with sample street capture:</span>
                <button
                  type="button"
                  onClick={() => loadSamplePhoto('pothole')}
                  className="rounded-md border border-[#E7ECE8] bg-white px-2.5 py-1 text-xs text-[#202C2A] hover:border-[#246B61]"
                >
                  Road Pothole
                </button>
                <button
                  type="button"
                  onClick={() => loadSamplePhoto('streetlight')}
                  className="rounded-md border border-[#E7ECE8] bg-white px-2.5 py-1 text-xs text-[#202C2A] hover:border-[#246B61]"
                >
                  Streetlight Outage
                </button>
                <button
                  type="button"
                  onClick={() => loadSamplePhoto('waste')}
                  className="rounded-md border border-[#E7ECE8] bg-white px-2.5 py-1 text-xs text-[#202C2A] hover:border-[#246B61]"
                >
                  Waste Overflow
                </button>
              </div>

              <div>
                <label htmlFor="ai-notes" className="block text-xs font-medium text-[#202C2A] mb-1">
                  Optional quick context for SmartReport AI
                </label>
                <div className="flex gap-2">
                  <input
                    id="ai-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Near school gate, flooded after morning rain"
                    className="flex-1 rounded-lg border border-[#E7ECE8] bg-white px-3 py-2 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => runSmartReport()}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#246B61] bg-white px-3.5 py-2 text-xs font-medium text-[#246B61] hover:bg-[#F0F4F1] whitespace-nowrap"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Draft with AI</span>
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <section className="rounded-xl border border-[#E7ECE8] bg-[#F6F8F6] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-base font-semibold text-[#202C2A]">
                  01. Multilingual Voice Reporting (English & हिन्दी)
                </h2>
                <div className="flex items-center gap-1 rounded-md bg-white border border-[#E7ECE8] p-0.5">
                  {(['en', 'hi', 'mixed'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setVoiceLang(lang)}
                      className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                        voiceLang === lang ? 'bg-[#246B61] text-white' : 'text-[#77827E] hover:text-[#202C2A]'
                      }`}
                    >
                      {lang === 'en' ? 'English' : lang === 'hi' ? 'हिन्दी' : 'Hinglish'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#E7ECE8] bg-white p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-[#202C2A]">
                    {recording ? 'Listening… describe the street issue & nearby landmark' : 'Speak about the issue instead of typing'}
                  </p>
                  <p className="mt-0.5 text-xs text-[#77827E]">
                    CivicSense transcribes your speech and prepares an editable English report.
                  </p>
                </div>
                {recording ? (
                  <button
                    type="button"
                    onClick={stopVoiceRecording}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#B91C1C] px-4 py-2.5 text-xs font-medium text-white whitespace-nowrap"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Stop & Transcribe</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoiceRecording}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#246B61] px-4 py-2.5 text-xs font-medium text-white hover:bg-[#194B45] whitespace-nowrap"
                  >
                    <Mic className="w-4 h-4" />
                    <span>Start Voice Recording</span>
                  </button>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="voice-transcript" className="text-xs font-medium text-[#202C2A]">
                    Spoken transcript (हिन्दी / English) — review or edit
                  </label>
                  {detectedLang && (
                    <span className="text-[11px] text-[#246B61] font-medium">Detected: {detectedLang}</span>
                  )}
                </div>
                <textarea
                  id="voice-transcript"
                  rows={3}
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="यहाँ हिन्दी या अंग्रेज़ी में समस्या लिखें या माइक से बोलें…"
                  className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3.5 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                />
                <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {SAMPLE_VOICE_PROMPTS.map((sample) => (
                      <button
                        key={sample.label}
                        type="button"
                        onClick={() => {
                          setVoiceLang(sample.lang);
                          setTranscript(sample.text);
                        }}
                        className="rounded-md border border-[#E7ECE8] bg-white px-2.5 py-1 text-xs text-[#202C2A] hover:border-[#246B61]"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={aiLoading || !transcript.trim()}
                    onClick={() => processVoicePayload({ transcriptText: transcript })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#246B61] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#194B45] disabled:opacity-50"
                  >
                    {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    <span>Structure Transcript</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {aiError && (
            <div role="alert" className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs text-[#B91C1C]">
              {aiError}
            </div>
          )}

          {/* AI Insights Review Banner (when AI populated suggestions) */}
          {(aiImageSummary || missingInfo.length > 0 || urgencyReason) && (
            <div className="rounded-xl border border-[#A9C4B4] bg-[#F0F4F1] p-5 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#194B45]">
                  AI Draft Ready — Please review and edit before submitting
                </p>
              </div>
              {aiImageSummary && <p className="text-xs text-[#202C2A]">{aiImageSummary}</p>}
              {urgencyReason && (
                <p className="text-xs text-[#194B45]">
                  <span className="font-semibold">Suggested urgency ({urgency}):</span> {urgencyReason}
                </p>
              )}
              {missingInfo.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#202C2A]">Potentially missing details to strengthen dispatch:</p>
                  <ul className="mt-1 space-y-1 text-xs text-[#77827E] list-disc pl-4">
                    {missingInfo.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Core Editable Report Fields */}
          <section className="rounded-xl border border-[#E7ECE8] bg-white p-6 space-y-4">
            <h2 className="font-display text-base font-semibold text-[#202C2A]">
              02. Review & finalize report details
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rep-category" className="block text-xs font-medium text-[#202C2A] mb-1">
                  Category
                </label>
                <select
                  id="rep-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IssueCategory)}
                  className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rep-urgency" className="block text-xs font-medium text-[#202C2A] mb-1">
                  Urgency level
                </label>
                <select
                  id="rep-urgency"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
                  className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="rep-title" className="block text-xs font-medium text-[#202C2A] mb-1">
                Report title
              </label>
              <input
                id="rep-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Clear summary of the issue and immediate landmark"
                className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3.5 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="rep-desc" className="block text-xs font-medium text-[#202C2A] mb-1">
                Detailed description
              </label>
              <textarea
                id="rep-desc"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe extent, duration, and any pedestrian or traffic impact..."
                className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3.5 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="rep-ward" className="block text-xs font-medium text-[#202C2A] mb-1">
                  Municipal ward
                </label>
                <select
                  id="rep-ward"
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
                <label htmlFor="rep-address" className="block text-xs font-medium text-[#202C2A] mb-1">
                  Street address / landmark
                </label>
                <input
                  id="rep-address"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-lg border border-[#E7ECE8] bg-white px-3.5 py-2.5 text-sm text-[#202C2A] focus:border-[#246B61] focus:outline-none"
                />
              </div>
            </div>

            {submitError && (
              <div role="alert" className="rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-xs text-[#B91C1C]">
                {submitError}
              </div>
            )}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs text-[#77827E]">
                {linkedClusterId ? `Linked to cluster ${linkedClusterId}` : 'Independent new report'}
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#246B61] px-6 py-3 text-sm font-medium text-white hover:bg-[#194B45] disabled:opacity-60 transition-colors"
              >
                <span>{submitting ? 'Submitting report...' : 'Submit Civic Report'}</span>
              </button>
            </div>
          </section>
        </form>

        {/* Right: Pin Location + Live Duplicate Intelligence */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#246B61]" />
                <h2 className="font-display text-sm font-semibold text-[#202C2A]">Pin exact location</h2>
              </div>
              <span className="font-mono text-[11px] text-[#77827E] tabular-nums">
                {mapCoords.x}%, {mapCoords.y}%
              </span>
            </div>
            <NeighbourhoodMap
              reports={reports}
              pickMode
              pickedCoords={mapCoords}
              onPickCoords={setMapCoords}
              heightClass="h-[260px]"
            />
          </div>

          <div className="rounded-xl border border-[#E7ECE8] bg-white p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-[#202C2A]">Duplicate Intelligence</h2>
                <p className="text-xs text-[#77827E]">
                  Checks proximity, category, timing & semantic similarity
                </p>
              </div>
              {checkingDuplicates && <Loader2 className="w-4 h-4 animate-spin text-[#246B61]" />}
            </div>

            {confirmMsg && (
              <div className="rounded-lg border border-[#A9C4B4] bg-[#F0F4F1] px-3 py-2 text-xs text-[#194B45]">
                {confirmMsg}
              </div>
            )}

            {duplicates.length === 0 ? (
              <div className="rounded-lg border border-[#E7ECE8] bg-[#F6F8F6] px-4 py-5 text-xs text-[#77827E] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[#246B61] shrink-0 mt-0.5" />
                <span>
                  No matching open reports detected within 350m for this category. Your submission will open a
                  new tracked ticket.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-[#B45309]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{duplicates.length} nearby related report(s) found</span>
                </div>
                {duplicates.map(({ report, similarityScore, distanceMeters, reason, matchSignals }) => (
                  <div
                    key={report.id}
                    className="rounded-lg border border-[#E7ECE8] bg-[#F6F8F6] p-4 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#77827E] tabular-nums">
                      <span>
                        {report.id} · {distanceMeters}m away
                      </span>
                      <span className="font-semibold text-[#246B61]">{similarityScore}% match</span>
                    </div>
                    <p className="text-sm font-medium text-[#202C2A]">{report.title}</p>
                    <p className="text-xs text-[#77827E] leading-relaxed">{reason}</p>
                    <div className="text-[11px] text-[#77827E]">
                      {matchSignals.join(' · ')}
                    </div>
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-[#E7ECE8]">
                      <StatusText status={report.status} />
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleConfirmExisting(report.id)}
                          className="text-xs font-semibold text-[#246B61] hover:text-[#194B45]"
                        >
                          Confirm existing
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setLinkedClusterId(report.duplicateClusterId || `CL-${report.id}`);
                          }}
                          className="text-xs font-medium text-[#77827E] hover:text-[#202C2A]"
                        >
                          Link cluster
                        </button>
                        <button
                          type="button"
                          onClick={() => onInspectReport(report.id)}
                          className="text-xs font-medium text-[#77827E] hover:text-[#202C2A]"
                        >
                          Open →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
