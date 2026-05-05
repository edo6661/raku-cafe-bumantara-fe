import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-sm font-semibold text-slate-700 ml-0.5">
        {label} {props.required && <span className="text-rose-500">*</span>}
      </label>
      <input
        className={twMerge(
          "w-full px-4 py-3 text-sm rounded-xl border transition-all duration-200 outline-none placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed",
          error
            ? "border-rose-300 bg-rose-50/30 focus:ring-4 focus:ring-rose-500/15 focus:border-rose-500 text-slate-900"
            : "border-slate-200 bg-white hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 text-slate-900 shadow-sm",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs font-medium text-rose-500 mt-0.5 ml-0.5 flex items-center gap-1 animate-in fade-in slide-in-from-top-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;