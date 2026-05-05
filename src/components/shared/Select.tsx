import type { SelectHTMLAttributes } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  error?: string;
}

const Select = ({ label, options, error, ...props }: SelectProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4 group w-full">
      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest transition-colors group-focus-within:text-slate-900 ml-1">
        {label}
      </label>
      <div className="relative">
        <select
          className={`w-full pl-4 pr-10 py-3 text-sm rounded-xl border transition-all duration-300 outline-none cursor-pointer appearance-none shadow-sm/50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200
            ${error
              ? 'border-red-300 bg-red-50/50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-slate-900'
              : 'border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-500 text-slate-900 bg-white'
            }`}
          {...props}
        >
          <option value="" disabled>Pilih {label}...</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="py-2 text-slate-800">
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Arrow Icon */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <span className="text-[11px] font-bold text-red-500 mt-0.5 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Select;