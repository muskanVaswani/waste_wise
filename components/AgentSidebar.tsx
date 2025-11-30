import React from 'react';
import { AGENTS } from '../constants';
import { AgentStatus, AgentType } from '../types';
import * as Lucide from 'lucide-react';

interface AgentSidebarProps {
  activeAgentId: AgentType;
}

const AgentSidebar: React.FC<AgentSidebarProps> = ({ activeAgentId }) => {
  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200 h-full flex flex-col shadow-sm hidden md:flex">
      <div className="p-6 border-b border-slate-100 bg-green-50">
        <h1 className="text-xl font-bold text-green-800 flex items-center gap-2">
          <Lucide.Recycle className="w-6 h-6" />
          WasteWise
        </h1>
        <p className="text-xs text-green-600 mt-1">Multi-Agent Sustainability System</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {AGENTS.map((agent) => {
          const Icon = (Lucide as any)[agent.icon] || Lucide.Bot;
          const isActive = activeAgentId === agent.id;
          
          return (
            <div 
              key={agent.id}
              className={`p-3 rounded-xl border transition-all duration-300 ${
                isActive 
                  ? 'border-green-400 bg-green-50 shadow-md transform scale-102' 
                  : 'border-slate-100 bg-white text-slate-400 opacity-80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full text-white ${agent.color} ${isActive ? 'animate-pulse' : ''}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <h3 className={`font-semibold text-sm ${isActive ? 'text-slate-800' : 'text-slate-500'}`}>
                    {agent.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1">{agent.description}</p>
                </div>
              </div>
              {isActive && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="text-[10px] font-medium text-green-700 uppercase tracking-wider">Processing</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-slate-50">
         <div className="bg-white p-3 rounded border border-slate-200 shadow-sm">
            <h4 className="text-xs font-semibold text-slate-700 mb-2">System Status</h4>
            <div className="flex justify-between items-center text-xs text-slate-600 mb-1">
               <span>Memory Usage</span>
               <span className="text-green-600">Optimal</span>
            </div>
             <div className="w-full bg-slate-100 h-1.5 rounded-full mb-3">
               <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '32%' }}></div>
             </div>
             <div className="flex justify-between items-center text-xs text-slate-600">
               <span>Active Threads</span>
               <span>{activeAgentId === 'ORCHESTRATOR' ? '1' : '2'}</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AgentSidebar;