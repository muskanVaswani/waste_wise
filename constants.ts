import { AgentStatus } from './types';

export const AGENTS: AgentStatus[] = [
  {
    id: 'ORCHESTRATOR',
    name: 'WasteWise Core',
    description: 'Coordinates requests and manages conversation flow.',
    icon: 'BrainCircuit',
    isActive: true,
    color: 'bg-slate-500'
  },
  {
    id: 'CLASSIFIER',
    name: 'Vision Scanner',
    description: 'Identifies waste items from images and descriptions.',
    icon: 'ScanEye',
    isActive: false,
    color: 'bg-blue-500'
  },
  {
    id: 'REUSE_SPECIALIST',
    name: 'Upcycle Bot',
    description: 'Generates creative DIY reuse ideas.',
    icon: 'Lightbulb',
    isActive: false,
    color: 'bg-amber-500'
  },
  {
    id: 'COMPOST_EXPERT',
    name: 'Rot Doctor',
    description: 'Analyzes decomposition and C:N ratios.',
    icon: 'Sprout',
    isActive: false,
    color: 'bg-green-600'
  },
  {
    id: 'LOCAL_RESOURCE',
    name: 'Geo Locator',
    description: 'Finds nearby recycling centers and donation points.',
    icon: 'MapPin',
    isActive: false,
    color: 'bg-red-500'
  },
  {
    id: 'IMPACT_ANALYST',
    name: 'Eco Tracker',
    description: 'Estimates environmental savings.',
    icon: 'BarChart3',
    isActive: false,
    color: 'bg-teal-500'
  }
];

export const INITIAL_GREETING = "Hello! I'm WasteWise. I can help you identify waste, find reuse ideas, plan composting, or locate recycling centers. Upload a photo or tell me what you have!";
