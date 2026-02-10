
import React, { useState, useRef, useEffect } from 'react';
import { weatherService, TemperatureUnit } from './services/geminiService';
import { MessageRole, WeatherMessage, ForecastDay, ChartPoint } from './types';
import { ChatBubble } from './components/ChatBubble';
import { WeatherMap } from './components/WeatherMap';
import * as Lucide from 'lucide-react';

const SUGGESTIONS = [
  "Local weather",
  "Is it raining in London?",
  "7-day forecast for New York",
  "Temperature trend for Tokyo"
];

const STORAGE_KEY = 'skyscope_chat_history';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning!";
  if (hour < 18) return "Good afternoon!";
  return "Good evening!";
};

const getInitialMessages = (): WeatherMessage[] => [
  {
    id: 'welcome',
    role: MessageRole.BOT,
    text: `${getGreeting()} I'm SkyScope. Ask me anything about the weather!`,
    timestamp: new Date(),
  }
];

const App: React.FC = () => {
  const embedParam = new URLSearchParams(window.location.search).get('embed');
  const isEmbedded = embedParam === '1' || embedParam === 'true';
  const [isOpen, setIsOpen] = useState(isEmbedded);
  const [view, setView] = useState<'chat' | 'map'>('chat');
  const [activeAlert, setActiveAlert] = useState<WeatherMessage | null>(null);
  const [unit, setUnit] = useState<TemperatureUnit>(() => {
    const saved = localStorage.getItem('skyscope_unit');
    return (saved as TemperatureUnit) || 'Celsius';
  });
  
  const [messages, setMessages] = useState<WeatherMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
    return getInitialMessages();
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Persistence effect
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    
    // Check if the most recent bot message is an alert
    const lastBotMsg = [...messages].reverse().find(m => m.role === MessageRole.BOT);
    if (lastBotMsg?.isAlert) {
      setActiveAlert(lastBotMsg);
    } else {
      setActiveAlert(null);
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('skyscope_unit', unit);
  }, [unit]);

  useEffect(() => {
    if (scrollRef.current && view === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, view]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (isListening) recognitionRef.current?.stop();
    else recognitionRef.current?.start();
  };

  const detectAlert = (text: string) => {
    const dangerKeywords = ['danger', 'emergency', 'tornado', 'hurricane', 'blizzard', 'extreme heat', 'severe storm'];
    const warningKeywords = ['warning', 'alert', 'storm', 'heavy rain', 'flood', 'caution', 'advisory'];
    
    const lowerText = text.toLowerCase();
    
    if (dangerKeywords.some(kw => lowerText.includes(kw))) {
      return { isAlert: true, alertType: 'danger' as const };
    }
    if (warningKeywords.some(kw => lowerText.includes(kw))) {
      return { isAlert: true, alertType: 'warning' as const };
    }
    
    return { isAlert: false, alertType: undefined };
  };

  const parseStructuredData = (text: string): { 
    cleanText: string, 
    forecast?: ForecastDay[], 
    chartData?: ChartPoint[] 
  } => {
    let cleanText = text;
    let forecast: ForecastDay[] | undefined;
    let chartData: ChartPoint[] | undefined;

    try {
      // Find JSON blocks in markdown code blocks
      const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
      let match;
      while ((match = jsonRegex.exec(text)) !== null) {
        const jsonStr = match[1];
        const data = JSON.parse(jsonStr);
        if (data.forecast) forecast = data.forecast;
        if (data.chartData) chartData = data.chartData;
        
        // Remove the JSON block from visible text
        cleanText = cleanText.replace(match[0], '');
      }
    } catch (e) {
      console.warn("Failed to parse structured data from AI response", e);
    }

    return { cleanText: cleanText.trim(), forecast, chartData };
  };

  const handleSend = async (textToQuery?: string) => {
    const query = textToQuery || input;
    if (!query.trim() || loading) return;

    // Switch to chat view if sending from map
    if (view === 'map') setView('chat');

    setMessages(prev => [...prev, { id: Date.now().toString(), role: MessageRole.USER, text: query, timestamp: new Date() }]);
    setInput('');
    setLoading(true);

    const botMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: botMsgId, role: MessageRole.BOT, text: '', timestamp: new Date(), isThinking: true }]);

    try {
      const response = await weatherService.queryWeather(query, location || undefined, unit);
      const alertInfo = detectAlert(response.text);
      const structured = parseStructuredData(response.text);
      
      setMessages(prev => prev.map(m => m.id === botMsgId ? { 
        ...m, 
        text: structured.cleanText, 
        sources: response.sources, 
        forecast: structured.forecast,
        chartData: structured.chartData,
        isThinking: false,
        ...alertInfo
      } : m));
    } catch (e) {
      setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, text: "Cluster unavailable. Try again soon.", isThinking: false } : m));
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = (id: string, feedback: 'up' | 'down') => {
    setMessages(prev => prev.map(m => {
      if (m.id === id) {
        // Toggle feedback if the same button is clicked
        const newFeedback = m.feedback === feedback ? null : feedback;
        return { ...m, feedback: newFeedback };
      }
      return m;
    }));
  };

  const requestLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (p) => {
        const newLoc = { lat: p.coords.latitude, lng: p.coords.longitude };
        setLocation(newLoc);
      },
      () => alert("Location access denied. Please enable GPS for local weather.")
    );
  };

  const toggleUnit = () => {
    setUnit(prev => prev === 'Celsius' ? 'Fahrenheit' : 'Celsius');
  };

  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear your chat history?")) {
      const fresh = getInitialMessages();
      setMessages(fresh);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* Chat Window */}
      <div className={`${isEmbedded ? 'mb-0' : 'mb-4'} w-[90vw] md:w-[450px] h-[700px] max-h-[85vh] flex flex-col glass rounded-3xl shadow-2xl transition-all duration-300 origin-bottom-right overflow-hidden ${
        isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
      }`}>
        {/* Header */}
        <header className="p-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-900/40 z-50 relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg">
              <Lucide.Wind className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">SkyScope AI</h1>
              <span className="text-[10px] text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Gemini 3 Pro Active
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setView(view === 'chat' ? 'map' : 'chat')}
              className={`p-2 rounded-lg transition-colors ${view === 'map' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              title={view === 'chat' ? "Open Weather Map" : "Back to Chat"}
            >
              {view === 'chat' ? <Lucide.Map className="w-4 h-4" /> : <Lucide.MessageSquare className="w-4 h-4" />}
            </button>
            <button 
              onClick={clearHistory}
              className="p-2 text-slate-400 hover:text-red-400 transition-colors"
              title="Clear History"
            >
              <Lucide.Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleUnit}
              className="flex items-center gap-1 px-2 py-1 bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors group"
              title={`Switch to ${unit === 'Celsius' ? 'Fahrenheit' : 'Celsius'}`}
            >
              <Lucide.Settings2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400" />
              <span className="text-[10px] font-bold text-slate-300">
                {unit === 'Celsius' ? '°C' : '°F'}
              </span>
            </button>
            {!isEmbedded && (
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                <Lucide.X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden flex flex-col">
          {/* Main Content Area */}
          {view === 'chat' ? (
            <>
              {/* Alert Banner */}
              {activeAlert && (
                <div className={`flex items-center gap-3 px-4 py-2 border-b animate-in fade-in slide-in-from-top duration-300 relative z-40 ${
                  activeAlert.alertType === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}>
                  <Lucide.ShieldAlert className="w-4 h-4 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest flex-1">
                    {activeAlert.alertType === 'danger' ? 'Severe Weather Hazard' : 'Weather Advisory Active'}
                  </span>
                  <button onClick={() => setActiveAlert(null)} className="p-1 opacity-50 hover:opacity-100">
                    <Lucide.X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Message List */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-hide bg-slate-950/20">
                {messages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} onFeedback={handleFeedback} />
                ))}
              </div>
            </>
          ) : (
            <WeatherMap location={location} onClose={() => setView('chat')} />
          )}
        </div>

        {/* Footer Area - Always Visible */}
        <div className="p-4 bg-slate-900/60 z-50">
          {!loading && view === 'chat' && messages.length < 5 && (
            <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)} className="whitespace-nowrap px-3 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-[10px] text-slate-300 hover:text-white transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
          
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask SkyScope AI..."}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl py-3 pl-4 pr-24 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white placeholder:text-slate-500"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button onClick={toggleListening} className={`p-2 rounded-xl transition-all ${isListening ? 'text-red-400 bg-red-400/10' : 'text-slate-400 hover:text-white'}`}>
                <Lucide.Mic className="w-4 h-4" />
              </button>
              <button onClick={requestLocation} className={`p-2 rounded-xl transition-all ${location ? 'text-blue-400' : 'text-slate-400 hover:text-white'}`}>
                <Lucide.MapPin className="w-4 h-4" />
              </button>
              <button 
                onClick={() => handleSend()} 
                disabled={loading || !input.trim()}
                className="p-2 bg-blue-600 text-white rounded-xl disabled:bg-slate-700 transition-all shadow-md hover:bg-blue-500 active:scale-95"
              >
                {loading ? <Lucide.Loader2 className="w-4 h-4 animate-spin" /> : <Lucide.Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Launcher Button */}
      {!isEmbedded && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`group p-4 rounded-full shadow-2xl transition-all duration-300 flex items-center justify-center ${
            isOpen ? 'bg-slate-800 rotate-90 scale-90' : 'bg-blue-600 hover:bg-blue-500 hover:scale-110'
          }`}
        >
          {isOpen ? (
            <Lucide.ChevronDown className="w-7 h-7 text-white" />
          ) : (
            <div className="relative">
              <Lucide.MessageSquareText className="w-7 h-7 text-white" />
              {!activeAlert && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-blue-600 rounded-full animate-pulse"></span>}
              {activeAlert && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center animate-bounce ${
                  activeAlert.alertType === 'danger' ? 'bg-red-500' : 'bg-amber-500'
                }`}>
                  <Lucide.AlertTriangle className="w-2 h-2 text-white" />
                </span>
              )}
            </div>
          )}
        </button>
      )}
    </div>
  );
};

export default App;
