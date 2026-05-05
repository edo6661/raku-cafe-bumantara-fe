import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4 group w-full">
      <label className="text-[12px] font-bold text-slate-500 uppercase tracking-widest transition-colors group-focus-within:text-slate-900 ml-1">
        {label}
      </label>
      <input
        className={twMerge(
          "w-full px-4 py-3 text-sm rounded-xl border transition-all duration-300 outline-none placeholder:text-slate-400 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed disabled:border-slate-200 shadow-sm/50",
          error
            ? "border-red-300 bg-red-50/50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-slate-900"
            : "border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-500 text-slate-900 bg-white",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-[11px] font-bold text-red-500 mt-0.5 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;