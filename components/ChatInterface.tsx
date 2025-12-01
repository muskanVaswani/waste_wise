import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Loader2, MapPin } from 'lucide-react';
import { Message, AgentType } from '../types';
import * as GeminiService from '../services/geminiService';
import { AGENTS } from '../constants';

interface ChatInterfaceProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  activeAgent: AgentType;
  setActiveAgent: (agent: AgentType) => void;
}

// Simple Markdown Formatter Component
const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  // Split content by newlines to process blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentList: React.ReactNode[] = [];
  let isListing = false;

  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Headers
    if (trimmed.startsWith('###')) {
      if (isListing) {
        elements.push(<ul key={`list-${index}`} className="mb-3 space-y-1">{currentList}</ul>);
        currentList = [];
        isListing = false;
      }
      elements.push(<h3 key={index} className="text-base font-bold text-green-800 mt-4 mb-2">{trimmed.replace(/^###\s*/, '')}</h3>);
      return;
    }
    
    if (trimmed.startsWith('##')) {
      if (isListing) {
        elements.push(<ul key={`list-${index}`} className="mb-3 space-y-1">{currentList}</ul>);
        currentList = [];
        isListing = false;
      }
      elements.push(<h2 key={index} className="text-lg font-bold text-green-900 mt-5 mb-3 border-b border-green-200 pb-1">{trimmed.replace(/^##\s*/, '')}</h2>);
      return;
    }

    // Lists (Bullets or Numbers)
    const isListItem = /^[*-]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed);
    
    if (isListItem) {
      isListing = true;
      const content = trimmed.replace(/^[*-]\s|^\d+\.\s/, '');
      currentList.push(
        <li key={`item-${index}`} className="flex items-start gap-2 text-sm text-slate-700 ml-1">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
          <span className="flex-1">{parseBold(content)}</span>
        </li>
      );
    } else {
      if (isListing) {
        elements.push(<ul key={`list-${index}`} className="mb-3 space-y-1 pl-1">{currentList}</ul>);
        currentList = [];
        isListing = false;
      }
      // Paragraphs (ignore empty lines unless they separate distinct blocks)
      if (trimmed) {
        elements.push(<p key={index} className="mb-2 text-sm leading-relaxed text-slate-700">{parseBold(line)}</p>);
      }
    }
  });

  // Flush remaining list
  if (isListing) {
    elements.push(<ul key="list-end" className="mb-3 space-y-1 pl-1">{currentList}</ul>);
  }

  return <div className="formatted-content">{elements}</div>;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  messages, 
  setMessages, 
  activeAgent, 
  setActiveAgent 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const fileToGenerativePart = async (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // remove data url prefix
        const base64Data = base64String.split(',')[1];
        resolve({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper for safe geolocation with timeout
  const getPosition = (options?: PositionOptions): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      type: selectedImage ? 'image' : 'text',
      imageUrl: previewUrl || undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    // Clear image selection but keep preview for message
    const currentImage = selectedImage;
    const currentPreview = previewUrl;
    setSelectedImage(null);
    setPreviewUrl(null);

    try {
      let agentToInvoke: AgentType = 'ORCHESTRATOR';
      let responseText = '';
      let mapData = null;

      // 1. Determine Intent or Handle Image
      if (currentImage) {
        setActiveAgent('CLASSIFIER');
        agentToInvoke = 'CLASSIFIER';
        const imageData = await fileToGenerativePart(currentImage);
        responseText = await GeminiService.classifyImage(imageData.data, imageData.mimeType);
        
        // After classification, we usually hand back to Orchestrator to ask what to do next
        responseText += "\n\n(I've identified this item. Would you like reuse ideas, composting advice, or recycling locations?)";
      } else {
        // Text only - determine intent
        setActiveAgent('ORCHESTRATOR'); // Briefly show orchestrator thinking
        
        // Quick pause to simulate handoff
        await new Promise(r => setTimeout(r, 600)); 
        
        const nextAgent = await GeminiService.determineAgentIntent(userMsg.content, false);
        agentToInvoke = nextAgent;
        setActiveAgent(nextAgent);

        // Execute Agent Action
        if (nextAgent === 'LOCAL_RESOURCE') {
          let location = undefined;
          
          try {
            // Strict 4s timeout. If user ignores the prompt, we move on.
            const position = await Promise.race([
              getPosition({ timeout: 4000, maximumAge: 60000 }),
              new Promise<GeolocationPosition>((_, reject) => 
                setTimeout(() => reject(new Error("Location timeout")), 4000)
              )
            ]);
            
            location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
          } catch (err) {
             console.log("Geolocation skipped or timed out:", err);
             // Proceed without location, the API will just return general results
          }
          
          const { text, grounding } = await GeminiService.findRecyclingCenters(userMsg.content, location);
          responseText = text;
          mapData = grounding;

        } else {
          // Standard text-based agents
           // Pass recent history for context
          const recentHistory = messages.slice(-5).map(m => ({ role: m.role, content: m.content }));
          responseText = await GeminiService.getAgentResponse(nextAgent, recentHistory, userMsg.content);
        }
      }

      finishResponse(responseText, agentToInvoke, mapData);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'system',
        content: "Sorry, I encountered an error connecting to the agent network. Please check your API key or internet connection.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
      setIsLoading(false);
      setActiveAgent('ORCHESTRATOR');
    }
  };

  const finishResponse = (text: string, agentId: AgentType, mapData?: any) => {
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: text,
        timestamp: Date.now(),
        agentName: AGENTS.find(a => a.id === agentId)?.name,
        mapData: mapData,
        type: mapData ? 'map_result' : 'text'
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsLoading(false);
      setActiveAgent('ORCHESTRATOR'); // Return to idle/orchestrator
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-slate-50">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] lg:max-w-[70%] space-y-1`}>
              {/* Agent Name Badge */}
              {msg.role === 'assistant' && msg.agentName && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-200">
                    {msg.agentName}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              )}

              <div 
                className={`p-4 rounded-2xl shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-green-600 text-white rounded-tr-none' 
                    : msg.role === 'system'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                }`}
              >
                {/* Image Display */}
                {msg.type === 'image' && msg.imageUrl && (
                  <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                    <img src={msg.imageUrl} alt="User upload" className="max-h-64 object-cover" />
                  </div>
                )}
                
                {/* Text Content */}
                <div className="text-sm">
                   {msg.role === 'assistant' ? (
                     <FormattedMessage content={msg.content} />
                   ) : (
                     <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                   )}
                </div>

                {/* Map/Grounding Data */}
                {msg.mapData && msg.mapData.length > 0 && (
                   <div className="mt-4 space-y-2">
                      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Found Locations:</div>
                      {/* Since text usually contains the list, we show a map indicator */}
                      <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                         <MapPin size={14} />
                         <span>Locations sourced via Google Maps</span>
                      </div>
                   </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-3">
               <Loader2 className="w-5 h-5 text-green-600 animate-spin" />
               <span className="text-sm text-slate-500 font-medium animate-pulse">
                 {activeAgent !== 'ORCHESTRATOR' 
                   ? `${AGENTS.find(a => a.id === activeAgent)?.name} is working...` 
                   : 'Orchestrator is thinking...'}
               </span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        {previewUrl && (
          <div className="mb-2 relative inline-block">
            <img src={previewUrl} alt="Preview" className="h-20 rounded-lg border border-slate-200 shadow-sm" />
            <button 
              onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        )}
        <div className="flex items-end gap-2 max-w-4xl mx-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
            title="Upload Image for Classification"
          >
            <ImageIcon size={20} />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageSelect}
            />
          </button>
          <div className="flex-1 bg-slate-100 rounded-2xl border border-transparent focus-within:border-green-300 focus-within:bg-white transition-all">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe waste, upload a photo, or ask for recycling tips..."
              className="w-full bg-transparent p-3 max-h-32 min-h-[48px] focus:outline-none text-slate-700 resize-none"
              rows={1}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={(!input.trim() && !selectedImage) || isLoading}
            className={`p-3 rounded-full shadow-md transition-all ${
              (!input.trim() && !selectedImage) || isLoading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 active:scale-95'
            }`}
          >
            <Send size={20} />
          </button>
        </div>
        <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400">
               WasteWise uses AI. Verify information locally.
            </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;