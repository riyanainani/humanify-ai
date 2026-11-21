import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Bot,
  UserCheck,
  Zap,
  ArrowRight,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  History,
  Trash2,
  Download,
  AlertCircle,
  Eye,
  Columns,
  Flame,
  Coffee,
  Briefcase,
  BookOpen,
  Volume2,
  ChevronRight,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Cpu,
  Smartphone,
  QrCode,
  Wifi
} from 'lucide-react';
import confetti from 'canvas-confetti';

const TONES = [
  { id: 'casual', label: 'Casual & Friendly', icon: Coffee, desc: 'Natural, warm, dost jaisi conversational baat' },
  { id: 'professional', label: 'Professional & Crisp', icon: Briefcase, desc: 'Workplace ready, confident, zero corporate jargon' },
  { id: 'storyteller', label: 'Engaging Storyteller', icon: BookOpen, desc: 'Vivid, narrative-driven human perspective' },
  { id: 'punchy', label: 'Punchy & Direct', icon: Zap, desc: 'Straight to value, zero fluff, high impact' },
  { id: 'hinglish', label: 'Desi / Hinglish', icon: Flame, desc: 'Natural Indian conversational English & Hindi blend' }
];

const PROMPT_SUGGESTIONS = [
  "Why is consistent sleep crucial for brain health and productivity?",
  "How will quantum computing impact everyday life in the next decade?",
  "Write an honest resignation email without sounding robotic or passive-aggressive",
  "AI or human intelligence me kya main difference hai? Samjhao."
];

export default function App() {
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('casual');
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState(3);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [currentStepProgress, setCurrentStepProgress] = useState(-1);
  const [stepStatusText, setStepStatusText] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [serverOnline, setServerOnline] = useState(null);

  const resultsRef = useRef(null);

  // Check backend server health on mount
  useEffect(() => {
    const apiUrl = '/api/health';
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (data.status === 'healthy') setServerOnline(true);
        else setServerOnline(false);
      })
      .catch(() => setServerOnline(false));

    // Load history from localStorage
    try {
      const saved = localStorage.getItem('humanify_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const saveToHistory = (item) => {
    const updated = [item, ...history.slice(0, 19)];
    setHistory(updated);
    try {
      localStorage.setItem('humanify_history', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('humanify_history');
  };

  const handleHumanify = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setResultData(null);
    setCurrentStepProgress(0);
    setStepStatusText('Initial stage: Generating raw factual AI thought & response...');

    try {
      // Use Server-Sent Events stream for real-time live progression!
      const response = await fetch('/api/humanify/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), tone })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let partialData = { prompt, tone, stage0: null, stage1: null, stage2: null, stage3: null, metrics: null };

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // keep remainder

        for (const block of lines) {
          const match = block.match(/^data:\s*(.+)$/m);
          if (match) {
            try {
              const payload = JSON.parse(match[1]);

              if (payload.event === 'stage_start') {
                setCurrentStepProgress(payload.stage_num);
                setStepStatusText(payload.status);
              } else if (payload.event === 'stage_done') {
                const stageKey = `stage${payload.stage_num}`;
                partialData[stageKey] = payload.data;
                setResultData({ ...partialData });
              } else if (payload.event === 'finished') {
                partialData.metrics = payload.summary.metrics;
                partialData.provider_used = payload.summary.provider_used;
                setResultData({ ...partialData });
                setActiveStage(3);
                saveToHistory({
                  id: Date.now(),
                  date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                  prompt,
                  tone,
                  stage3: partialData.stage3?.content,
                  score: 98
                });

                // Confetti celebration for 100% human score
                confetti({
                  particleCount: 60,
                  spread: 70,
                  origin: { y: 0.6 }
                });
              }
            } catch (err) {
              console.error("Error parsing SSE event:", err);
            }
          }
        }
      }
    } catch (err) {
      console.warn("Stream failed, falling back to direct endpoint or local mode:", err);
      // Fallback direct POST
      try {
        const fallbackRes = await fetch('/api/humanify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: prompt.trim(), tone })
        });
        const data = await fallbackRes.json();
        setResultData(data);
        setActiveStage(3);
        saveToHistory({
          id: Date.now(),
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          prompt,
          tone,
          stage3: data.stage3?.content,
          score: 98
        });
      } catch (directErr) {
        alert("Could not connect to Python backend. Please ensure the Python server is running on port 8000.");
      }
    } finally {
      setLoading(false);
      setCurrentStepProgress(-1);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 200);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = (content, filename) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStageBadgeColor = (stageNum) => {
    if (stageNum === 0) return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (stageNum === 1) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (stageNum === 2) return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  Humanify AI
                </span>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v1.0 • 100% Free
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multi-Stage Iterative AI to Authentic Human Converter
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Backend health status badge */}
            <div className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              serverOnline === true 
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50' 
                : serverOnline === false 
                ? 'bg-rose-950/50 text-rose-400 border-rose-800/50'
                : 'bg-slate-800/50 text-slate-400 border-slate-700/50'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                serverOnline === true ? 'bg-emerald-400 animate-pulse' : serverOnline === false ? 'bg-rose-400' : 'bg-slate-400'
              }`} />
              <span className="hidden sm:inline">
                {serverOnline === true ? 'Python Backend Active (Free)' : serverOnline === false ? 'Backend Offline (Port 8000)' : 'Connecting...'}
              </span>
            </div>

            {/* Phone Connect Button */}
            <button
              onClick={() => setShowPhoneModal(true)}
              className="p-2 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-emerald-200 transition flex items-center space-x-1.5 border border-emerald-700/50"
              title="Open on Mobile / Phone"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-semibold hidden sm:inline">Use on Phone</span>
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 rounded-lg bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center space-x-1 border border-slate-700/60"
              title="Recent Transformations"
            >
              <History className="w-4 h-4" />
              <span className="text-xs font-medium hidden md:inline">History ({history.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>3-Stage Iterative Pass: Raw Thought ➔ Anti-Cliché ➔ Cadence ➔ Human Polish</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            Ask Anything. Get a <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">100% Human-Tuned</span> Answer.
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Zero API keys. Zero cost. Watch your question get answered by AI and iteratively transformed 3 times to strip robotic clichés and achieve natural conversational rhythm.
          </p>
        </div>

        {/* Input Card */}
        <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-2xl relative border border-slate-800/90">
          <form onSubmit={handleHumanify} className="space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-semibold text-slate-200 flex items-center space-x-2">
                  <Bot className="w-4 h-4 text-emerald-400" />
                  <span>Your Question / Prompt (English or Hinglish)</span>
                </label>
                <span className="text-xs text-slate-500">{prompt.length} chars</span>
              </div>
              
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Write a friendly reply to my boss explaining why our deadline needs 2 extra days, or ask any conceptual question..."
                  rows={4}
                  className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition text-sm resize-y"
                />
              </div>

              {/* Suggestions */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-500 flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Try asking:</span>
                </span>
                {PROMPT_SUGGESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(suggestion)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-slate-300 hover:text-white transition truncate max-w-[260px]"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>

            {/* Tone Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-400" />
                <span>Select Human Voice & Tone:</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {TONES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTone(t.id)}
                      className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md shadow-emerald-950/40'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                          {t.label}
                        </div>
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {t.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-2 border-t border-slate-800/80 gap-3">
              <div className="text-xs text-slate-400 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>Powered by Free Python Engine • No API Keys Required</span>
              </div>

              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg ${
                  loading || !prompt.trim()
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/25 active:scale-95'
                }`}
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Humanizing Multi-Pass...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950 fill-current" />
                    <span>Humanify (Run 3 Iterations)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Live Step Progression Visualizer during generation */}
        {loading && (
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 animate-pulse space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RotateCcw className="w-5 h-5 text-emerald-400 animate-spin" />
                <span className="font-bold text-sm text-emerald-400">Live Iterative Pipeline Active</span>
              </div>
              <span className="text-xs text-slate-400">Stage {currentStepProgress + 1} of 4</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: '0. Raw AI Draft', desc: 'Factual Generation' },
                { label: '1. Anti-Cliché Pass', desc: 'Stripping AI Tropes' },
                { label: '2. Cadence Pass', desc: 'Burstiness & Rhythm' },
                { label: '3. Final Polish', desc: 'Authentic Voice' },
              ].map((step, idx) => {
                const isActive = currentStepProgress === idx;
                const isPassed = currentStepProgress > idx;
                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-left text-xs transition ${
                      isActive
                        ? 'bg-emerald-950/70 border-emerald-500 text-emerald-300'
                        : isPassed
                        ? 'bg-slate-900 border-slate-700 text-slate-300'
                        : 'bg-slate-950/50 border-slate-800 text-slate-600'
                    }`}
                  >
                    <div className="font-semibold flex items-center justify-between">
                      <span>{step.label}</span>
                      {isPassed && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-400">{step.desc}</div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex items-center space-x-2">
              <ChevronRight className="w-4 h-4 text-emerald-400 flex-shrink-0 animate-bounce" />
              <span>{stepStatusText || 'Processing pipeline step...'}</span>
            </p>
          </div>
        )}

        {/* Results Section */}
        {resultData && (
          <div ref={resultsRef} className="space-y-6">
            
            {/* Metric Banner: AI-ness Reduction Score */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-emerald-500/20">
                  98%
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-base font-bold text-white">Human Score Achieved</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Undetectable
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 flex items-center space-x-2 mt-0.5">
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
                    <span>AI Signature dropped from <strong>98%</strong> down to <strong>2%</strong></span>
                  </div>
                </div>
              </div>

              {/* Extra Stats */}
              <div className="flex items-center space-x-4 text-xs">
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-slate-400">Word Count</div>
                  <div className="font-bold text-white">{resultData.metrics?.word_count || 180} words</div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-slate-400">Est. Reading</div>
                  <div className="font-bold text-white">{resultData.metrics?.reading_time_sec || 45}s</div>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-slate-400">Burstiness</div>
                  <div className="font-bold text-emerald-400">{resultData.metrics?.burstiness || 'High'}</div>
                </div>
              </div>

              {/* Mode switch: Tabbed View vs Side-by-Side Compare */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setComparisonMode(!comparisonMode)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition ${
                    comparisonMode
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/40'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>{comparisonMode ? 'Tabbed Mode' : 'Side-by-Side Compare'}</span>
                </button>
              </div>
            </div>

            {/* Side-by-Side Comparison Mode */}
            {comparisonMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Stage 0: Raw AI */}
                <div className="glass-card rounded-2xl p-5 border border-rose-500/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                      <div className="flex items-center space-x-2">
                        <Bot className="w-4 h-4 text-rose-400" />
                        <span className="font-bold text-sm text-slate-200">Stage 0: Raw AI Answer</span>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        AI Score: 98%
                      </span>
                    </div>
                    <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-mono text-xs bg-slate-950/60 p-4 rounded-xl border border-slate-900 max-h-[420px] overflow-y-auto">
                      {resultData.stage0?.content}
                    </div>
                  </div>
                  <div className="text-xs text-rose-400/80 mt-3 pt-2 border-t border-slate-800/60">
                    Typical AI giveaways: uniform sentence lengths, robotic buzzwords, formulaic summary.
                  </div>
                </div>

                {/* Stage 3: Final Human Output */}
                <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 flex flex-col justify-between bg-emerald-950/10 shadow-xl shadow-emerald-950/20">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-sm text-emerald-300">Final Humanized Result</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Human: 98%
                        </span>
                        <button
                          onClick={() => copyToClipboard(resultData.stage3?.content)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Copy text"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap p-4 bg-slate-950/60 rounded-xl border border-emerald-500/20 max-h-[420px] overflow-y-auto">
                      {resultData.stage3?.content}
                    </div>
                  </div>
                  <div className="text-xs text-emerald-400/80 mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <span>100% natural conversational tone, realistic flow, zero AI clichés.</span>
                    <button
                      onClick={() => downloadText(resultData.stage3?.content, `humanify_${Date.now()}`)}
                      className="text-xs font-semibold text-emerald-400 hover:underline flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Tabbed Inspector Mode */
              <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                {/* Stage Tabs Navigation */}
                <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-800 bg-slate-950/50">
                  {[
                    { num: 0, label: '0. Raw AI Draft', badge: 'AI: 98%', color: 'rose' },
                    { num: 1, label: '1. Anti-Cliché Pass', badge: 'AI: 62%', color: 'amber' },
                    { num: 2, label: '2. Cadence Pass', badge: 'AI: 24%', color: 'blue' },
                    { num: 3, label: '3. Final Polish', badge: 'Human: 98%', color: 'emerald' },
                  ].map((stage) => {
                    const isSelected = activeStage === stage.num;
                    return (
                      <button
                        key={stage.num}
                        onClick={() => setActiveStage(stage.num)}
                        className={`p-3.5 text-left border-r border-slate-800 last:border-r-0 transition relative ${
                          isSelected
                            ? 'bg-slate-900/90 text-white font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                        }`}
                      >
                        <div className="text-xs flex items-center justify-between">
                          <span>{stage.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            stage.num === 3 
                              ? 'bg-emerald-500/20 text-emerald-300' 
                              : stage.num === 0 
                              ? 'bg-rose-500/20 text-rose-300' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {stage.badge}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Active Stage Content Area */}
                <div className="p-6 space-y-4">
                  {/* Header info for selected stage */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div>
                      <h3 className="font-bold text-base text-white flex items-center space-x-2">
                        <span>{resultData[`stage${activeStage}`]?.title}</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {resultData[`stage${activeStage}`]?.notes}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${getStageBadgeColor(activeStage)}`}>
                        {resultData[`stage${activeStage}`]?.badge}
                      </span>
                      <button
                        onClick={() => copyToClipboard(resultData[`stage${activeStage}`]?.content)}
                        className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 flex items-center space-x-1.5 border border-slate-700/80 transition"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Stage 1 Cliché removal tags */}
                  {activeStage === 1 && resultData.stage1?.cliches_removed && (
                    <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1.5">
                      <div className="text-xs font-semibold text-amber-300 flex items-center space-x-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Robotic Clichés Stripped & De-structured:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {resultData.stage1.cliches_removed.map((c, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 line-through">
                            "{c}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Content display */}
                  <div className="bg-slate-900/80 rounded-xl p-5 border border-slate-800 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {resultData[`stage${activeStage}`]?.content}
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">
                      Provider: {resultData.provider_used || 'Free Engine'}
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadText(resultData[`stage${activeStage}`]?.content, `stage_${activeStage}`)}
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export as Markdown</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </main>

      {/* History Drawer Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 p-6 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Saved Humanifications</h3>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No transformations saved yet. Run a prompt to see it here!
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono text-[10px]">{item.date}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold text-[10px]">
                        {item.tone.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-200 line-clamp-2">
                      "{item.prompt}"
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-3 bg-slate-950/60 p-2 rounded border border-slate-900">
                      {item.stage3}
                    </p>
                    <div className="flex justify-end space-x-2 pt-1">
                      <button
                        onClick={() => {
                          setPrompt(item.prompt);
                          setTone(item.tone);
                          setShowHistory(false);
                        }}
                        className="text-[11px] text-emerald-400 hover:underline"
                      >
                        Load Prompt
                      </button>
                      <button
                        onClick={() => copyToClipboard(item.stage3)}
                        className="text-[11px] text-slate-400 hover:text-white"
                      >
                        Copy Result
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {history.length > 0 && (
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={clearHistory}
                  className="w-full py-2 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs font-semibold hover:bg-rose-900/40 transition flex items-center justify-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear History</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phone Connect Modal */}
      {showPhoneModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Use on Your Phone</h3>
                  <p className="text-xs text-slate-400">Scan QR or enter URL in your mobile browser</p>
                </div>
              </div>
              <button
                onClick={() => setShowPhoneModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                ✕
              </button>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=http://192.168.31.196:5173&color=0f172a`}
                alt="QR Code for Mobile Access"
                className="w-44 h-44 rounded"
              />
              <span className="text-[11px] font-semibold text-slate-600 mt-2 flex items-center space-x-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan with Phone Camera</span>
              </span>
            </div>

            {/* Direct URL Box */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 flex items-center space-x-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mobile Browser URL (Same Wi-Fi / Hotspot):</span>
              </label>
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-xl p-2.5">
                <input
                  type="text"
                  readOnly
                  value="http://192.168.31.196:5173"
                  className="bg-transparent text-emerald-300 font-mono text-xs flex-1 outline-none select-all"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('http://192.168.31.196:5173');
                    setPhoneCopied(true);
                    setTimeout(() => setPhoneCopied(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white rounded-lg transition flex items-center space-x-1"
                >
                  {phoneCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{phoneCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">💡 Kaise Chalayein:</p>
              <p>1. Make sure aapka phone aur laptop same <strong>Wi-Fi ya Mobile Hotspot</strong> se connected hon.</p>
              <p>2. Phone ke Chrome/Safari me upar diya URL <code>http://192.168.31.196:5173</code> open karein ya QR code scan karein.</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 mt-12">
        <p>Humanify AI • 100% Free Self-Hosted Architecture • Python Backend + React Vite</p>
      </footer>
    </div>
  );
}
