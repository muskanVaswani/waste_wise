import React, { useState } from 'react';
import AgentSidebar from './components/AgentSidebar';
import ChatInterface from './components/ChatInterface';
import ToolsPanel from './components/ToolsPanel';
import { Message, AgentType } from './types';
import { INITIAL_GREETING } from './constants';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: INITIAL_GREETING,
      timestamp: Date.now(),
      agentName: 'WasteWise Core'
    }
  ]);
  const [activeAgent, setActiveAgent] = useState<AgentType>('ORCHESTRATOR');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to compile chat history for export
  const getChatHistoryText = () => {
    return messages.map(m => `[${new Date(m.timestamp).toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`).join('\n\n');
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 bg-white rounded-md shadow border border-slate-200"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar - Hidden on mobile unless toggled */}
      <div className={`fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <AgentSidebar activeAgentId={activeAgent} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative">
        <ChatInterface 
          messages={messages} 
          setMessages={setMessages} 
          activeAgent={activeAgent}
          setActiveAgent={setActiveAgent}
        />
      </main>

      {/* Tools Panel - Right side on desktop */}
      <ToolsPanel chatHistory={getChatHistoryText()} />

      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;