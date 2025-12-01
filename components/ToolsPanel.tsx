import React, { useState } from 'react';
import { Download, Calculator, Leaf } from 'lucide-react';

interface ToolsPanelProps {
  chatHistory: string;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({ chatHistory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [browns, setBrowns] = useState(0);
  const [greens, setGreens] = useState(0);

  const calculateRatio = () => {
    // Simple mock calculation C:N estimate
    // Browns are high C (~30-50:1), Greens are low C (~10-20:1)
    // Ideal is 30:1
    const totalMass = browns + greens;
    if (totalMass === 0) return 0;
    // Weighted avg assumption
    const ratio = ((browns * 50) + (greens * 15)) / totalMass;
    return ratio.toFixed(1);
  };

  const ratio = calculateRatio();
  const ratioNum = parseFloat(ratio as string);
  const ratioStatus = ratioNum > 25 && ratioNum < 35 ? 'Optimal' : ratioNum > 35 ? 'Too much Brown' : 'Too much Green';

  const downloadPlan = () => {
    const element = document.createElement("a");
    const file = new Blob([chatHistory], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "WasteWise_Plan.txt";
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="bg-white border-l border-slate-200 w-full md:w-72 hidden lg:flex flex-col">
      <div className="p-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-700 flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Tools
        </h2>
      </div>

      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        
        {/* Compost Calculator Tool */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            Compost Mix Calc
          </h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Browns (Dry Leaves, Paper)</label>
              <input 
                type="range" min="0" max="10" 
                value={browns} 
                onChange={(e) => setBrowns(parseInt(e.target.value))}
                className="w-full accent-amber-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-right text-xs text-slate-600">{browns} parts</div>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Greens (Scraps, Grass)</label>
              <input 
                type="range" min="0" max="10" 
                value={greens} 
                onChange={(e) => setGreens(parseInt(e.target.value))}
                className="w-full accent-green-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-right text-xs text-slate-600">{greens} parts</div>
            </div>
            
            <div className="pt-2 border-t border-slate-200">
              <div className="flex justify-between text-sm font-medium">
                <span>C:N Ratio:</span>
                <span className={ratioStatus === 'Optimal' ? 'text-green-600' : 'text-orange-500'}>
                  {ratio}:1
                </span>
              </div>
              <div className="text-xs text-center mt-1 text-slate-500">
                {ratioStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Download Tool */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <h3 className="text-sm font-medium text-slate-800 mb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-600" />
            Export Plan
          </h3>
          <p className="text-xs text-slate-500 mb-3">
            Download your current waste management plan and chat history.
          </p>
          <button 
            onClick={downloadPlan}
            className="w-full py-2 bg-white border border-slate-300 text-slate-700 text-xs font-medium rounded hover:bg-slate-50 transition-colors"
          >
            Download .txt
          </button>
        </div>

      </div>
    </div>
  );
};

export default ToolsPanel;