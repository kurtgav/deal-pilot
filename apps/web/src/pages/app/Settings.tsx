export default function Settings() {
  return (
    <div className="max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Voice Agent */}
      <div className="dash-card p-6 space-y-4">
        <h2 className="text-[14px] font-semibold text-slate-900">Voice Agent</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[13px] text-slate-500">Agent Name</span>
            <input defaultValue="DealPilot AI" className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300 transition-colors" />
          </label>
          <label className="block">
            <span className="text-[13px] text-slate-500">Voice Style</span>
            <select className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300 bg-white">
              <option>Professional</option>
              <option>Conversational</option>
              <option>Technical</option>
            </select>
          </label>
          <label className="block">
            <span className="text-[13px] text-slate-500">Max Call Duration</span>
            <input type="number" defaultValue={15} className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300" />
            <span className="text-[12px] text-slate-400">minutes</span>
          </label>
        </div>
      </div>

      {/* Handoff Defaults */}
      <div className="dash-card p-6 space-y-4">
        <h2 className="text-[14px] font-semibold text-slate-900">Handoff Defaults</h2>
        <div className="space-y-3">
          <label className="block">
            <span className="text-[13px] text-slate-500">Default Assignee</span>
            <input defaultValue="Sales Team" className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300 transition-colors" />
          </label>
          <label className="block">
            <span className="text-[13px] text-slate-500">Qualification Threshold</span>
            <input type="number" defaultValue={70} className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300" />
            <span className="text-[12px] text-slate-400">score out of 100</span>
          </label>
          <label className="block">
            <span className="text-[13px] text-slate-500">Auto-generate Summary</span>
            <select className="mt-1 w-full px-3 py-2 rounded-lg border border-[#f0f0f0] text-[14px] text-slate-800 outline-none focus:border-indigo-300 bg-white">
              <option>Always</option>
              <option>Only for qualified leads</option>
              <option>Never</option>
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
