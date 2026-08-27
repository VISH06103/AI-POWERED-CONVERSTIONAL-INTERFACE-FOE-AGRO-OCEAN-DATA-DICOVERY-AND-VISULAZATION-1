import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Bot, 
  User, 
  Sparkles, 
  WifiOff, 
  RotateCcw, 
  Copy, 
  Check, 
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Compass,
  MapPin,
  Waves
} from 'lucide-react';
import { ArgoFloat, ChatMessage, CoastalPort, OceanRiskLevel, UserProfile, VillageConditionResult } from '../types';
import { identifyVillageOrStateConditionAsync, identifyVillageOrStateCondition } from '../data/coastalVillages';

interface ChatAssistantProps {
  selectedPort: CoastalPort;
  selectedFloat: ArgoFloat;
  currentLanguage: string;
  isOffline: boolean;
  onPlayVoice: (text: string) => void;
  externalQuery?: string;
  onClearExternalQuery?: () => void;
  currentUser?: UserProfile | null;
  activeVillageResult?: VillageConditionResult | null;
  floats?: ArgoFloat[];
  onLocationTracked?: (res: VillageConditionResult) => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  selectedPort,
  selectedFloat,
  currentLanguage,
  isOffline,
  onPlayVoice,
  externalQuery,
  onClearExternalQuery,
  currentUser,
  activeVillageResult,
  floats = [],
  onLocationTracked,
}) => {
  const activeVillageName = activeVillageResult?.villageName || currentUser?.villageOrPort || selectedPort.name;
  const activeStateName = activeVillageResult?.state || currentUser?.state || selectedPort.state;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: currentUser
        ? `Ahoy Captain ${currentUser.name}! I am FloatChat AI. I'm actively tracking ocean conditions for ${currentUser.villageOrPort} (${currentUser.state}). Enter any coastal village or state name in our chat, and I will track that exact location, check the nearest ARGO ocean buoys, and give you real-time safety decisions!`
        : `Ahoy Captain! I am FloatChat AI. I monitor deep ARGO ocean buoys along ${selectedPort.name} and the ${selectedPort.basin}. Type any village, coastal port, or state name, and I will automatically identify and track conditions for that location!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actionPills: [
        `Is it safe to go fishing near ${activeVillageName.split(' ')[0]} today?`,
        `Check sea condition for Kasimedu, Tamil Nadu`,
        `What is the wave height and cyclone risk in Veraval, Gujarat?`,
        `Explain ARGO buoy #${selectedFloat.wmoId} data in simple words`,
      ],
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync welcome message if currentUser updates
  useEffect(() => {
    if (currentUser && messages.length === 1 && messages[0].id === 'welcome-msg') {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          content: `Ahoy Captain ${currentUser.name}! I am FloatChat AI. I'm actively monitoring deep ARGO ocean buoys near ${currentUser.villageOrPort} (${currentUser.state}). Ask me about sea safety, cyclone danger, swell alerts for ${currentUser.boatName}, or voice instructions in your native tongue!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionPills: [
            `Is it safe to go fishing near ${currentUser.villageOrPort.split(' ')[0]} today?`,
            `Explain ARGO buoy #${selectedFloat.wmoId} data in simple words`,
            `What is Tropical Cyclone Heat Potential (TCHP)?`,
            `Generate an emergency SMS for my crew`,
          ],
        },
      ]);
    }
  }, [currentUser]);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle external query trigger
  useEffect(() => {
    if (externalQuery) {
      handleSendMessage(externalQuery);
      if (onClearExternalQuery) onClearExternalQuery();
    }
  }, [externalQuery]);

  // Web Speech Recognition for voice mic input
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = currentLanguage === 'ta' ? 'ta-IN' 
          : currentLanguage === 'ml' ? 'ml-IN' 
          : currentLanguage === 'hi' ? 'hi-IN' 
          : currentLanguage === 'te' ? 'te-IN' 
          : currentLanguage === 'bn' ? 'bn-BD' 
          : currentLanguage === 'es' ? 'es-ES' 
          : 'en-US';

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(transcript);
          setIsListening(false);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [currentLanguage]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // 1. Dynamic Location Identification in Chat Messages
      let contextFloat = selectedFloat;
      let contextVillage = activeVillageResult?.villageName || currentUser?.villageOrPort || selectedPort.name;
      let contextDistrict = activeVillageResult?.district || '';
      let contextState = activeVillageResult?.state || currentUser?.state || selectedPort.state;
      let contextDistanceKm = activeVillageResult?.distanceToFloatKm ? String(activeVillageResult.distanceToFloatKm) : '';
      let contextDistanceNm = activeVillageResult?.trackInfo?.distanceNauticalMiles ? String(activeVillageResult.trackInfo.distanceNauticalMiles) : '';

      // Check if user query mentions any state, village, harbor, or coordinate
      try {
        const detectedLoc = await identifyVillageOrStateConditionAsync(query, floats.length > 0 ? floats : [selectedFloat], isOffline);
        // If detected a real place match rather than purely generic query
        if (detectedLoc && !detectedLoc.isCustomGeocoded) {
          contextFloat = detectedLoc.nearestFloat;
          contextVillage = detectedLoc.villageName;
          contextDistrict = detectedLoc.district;
          contextState = detectedLoc.state;
          contextDistanceKm = String(detectedLoc.distanceToFloatKm);
          contextDistanceNm = String(detectedLoc.trackInfo?.distanceNauticalMiles || Math.round(detectedLoc.distanceToFloatKm * 0.539957));
          if (onLocationTracked) {
            onLocationTracked(detectedLoc);
          }
        }
      } catch {
        // Continue with current active context
      }

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          context: {
            selectedPort,
            selectedFloat: contextFloat,
            language: currentLanguage,
            offlineMode: isOffline,
            captainName: currentUser?.name,
            boatName: currentUser?.boatName,
            boatType: currentUser?.boatType,
            villageName: contextVillage,
            district: contextDistrict,
            state: contextState,
            distanceKm: contextDistanceKm,
            distanceNm: contextDistanceNm,
          },
        }),
      });

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No response available.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOfflineResponse: Boolean(data.source?.includes('offline') || data.isFallback),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      const fallbackMsg: ChatMessage = {
        id: `fallback-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ [Offline Safety Rule] High precaution recommended for ${activeVillageName}. Nearest ARGO buoy #${selectedFloat.wmoId} records TCHP ${selectedFloat.tchp} kJ/cm² and wave swell ${selectedFloat.waveHeight}m. Verify VHF Ch 16 with Coast Guard.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOfflineResponse: true,
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div id="chat-assistant" className="flex flex-col h-[520px] bg-[#0b0f19] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      
      {/* Chat Top Banner */}
      <div className="p-3.5 sm:p-4 bg-[#020617] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/30">
            <Bot className="w-5 h-5" />
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-[#020617] shadow-[0_0_6px_rgba(16,185,129,0.8)]"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">FloatChat AI Assistant</h3>
              {isOffline ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800 text-amber-300 flex items-center gap-1">
                  <WifiOff className="w-3 h-3" /> Offline Engine
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-950/80 border border-blue-800/80 text-blue-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-blue-400" /> Gemini 3.7 Marine
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-emerald-400 shrink-0 animate-pulse" />
              <span className="truncate font-semibold text-white">{activeVillageName}</span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 font-mono">ARGO #{selectedFloat.wmoId}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => setMessages([messages[0]])}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 ocean-dot-grid">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
              
              <div className={`flex items-start gap-3 max-w-[90%] sm:max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
                {!isUser ? (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-md shadow-blue-900/30">
                    AI
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-700 shrink-0 flex items-center justify-center text-[10px] font-bold text-white shadow-md">
                    ME
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-900/20'
                      : 'bg-slate-800 p-3.5 rounded-2xl rounded-tl-none text-slate-200 border border-slate-700/60'
                  }`}
                >
                  {/* Offline Tag Badge */}
                  {!isUser && msg.isOfflineResponse && (
                    <div className="mb-1.5 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                      <WifiOff className="w-3 h-3" /> Offline Cached Knowledge
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.content}
                  </div>

                  {/* Assistant Message Actions */}
                  {!isUser && (
                    <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-mono text-[10px]">{msg.timestamp}</span>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onPlayVoice(msg.content)}
                          className="hover:text-blue-400 flex items-center gap-1 transition-colors"
                          title="Read out loud"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Voice</span>
                        </button>
                        <button
                          onClick={() => handleCopyText(msg.id, msg.content)}
                          className="hover:text-blue-400 flex items-center gap-1 transition-colors"
                          title="Copy advice"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Pills */}
              {msg.actionPills && msg.actionPills.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5 pl-9">
                  {msg.actionPills.map((pill, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(pill)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[11px] font-medium transition-all hover:border-blue-500 active:scale-95 text-left shadow-sm"
                    >
                      💡 {pill}
                    </button>
                  ))}
                </div>
              )}

            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-950/80 border border-blue-800/80 text-blue-400 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 text-xs flex items-center gap-2 shadow-md">
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="font-medium">Analyzing ARGO CTD profile & computing risk...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Bar */}
      <div className="px-3 py-2 bg-[#020617]/90 border-t border-slate-800/80 overflow-x-auto flex gap-1.5 no-scrollbar">
        <button
          onClick={() => handleSendMessage(`What are the swell and wave conditions for tonight?`)}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors shadow-sm"
        >
          🌊 Wave Swells
        </button>
        <button
          onClick={() => handleSendMessage(`Are there any cyclone precursors in the Bay of Bengal or Arabian Sea?`)}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors shadow-sm"
        >
          🌀 Cyclone Watch
        </button>
        <button
          onClick={() => handleSendMessage(`Where is the nearest safe fishing zone with good upwelling?`)}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors shadow-sm"
        >
          🐟 Safe Fishing Zones
        </button>
        <button
          onClick={() => handleSendMessage(`கடலில் இப்போது மீன்பிடிக்க செல்வது பாதுகாப்பானதா? (Is it safe in Tamil)`)}
          className="whitespace-nowrap px-3 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-[11px] text-slate-300 border border-slate-800 transition-colors shadow-sm"
        >
          🇮🇳 தமிழ் Advisory
        </button>
      </div>

      {/* Input Box */}
      <div className="p-3 bg-[#020617] border-t border-slate-800 flex items-center gap-2">
        <button
          onClick={toggleListening}
          className={`p-2.5 rounded-xl border transition-all ${
            isListening
              ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-lg shadow-red-600/40'
              : 'bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300'
          }`}
          title={isListening ? 'Stop listening' : 'Speak into microphone (hands-free)'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-blue-400" />}
        </button>

        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder={isListening ? 'Listening to voice...' : `Ask FloatChat about ${selectedPort.name.split(' ')[0]} sea risk...`}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-500"
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputMessage.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-600/30"
          title="Send query"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
