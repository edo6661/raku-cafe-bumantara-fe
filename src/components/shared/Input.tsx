import type { InputHTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = ({ label, error, className, ...props }: InputProps) => {
  return (
    <div className="flex flex-col gap-1.5 mb-4 group w-full">
      <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest transition-colors group-focus-within:text-zinc-900 ml-1">
        {label}
      </label>
      <input
        className={twMerge(
          "w-full px-4 py-3.5 text-sm rounded-xl border transition-all duration-300 outline-none placeholder:text-zinc-400 disabled:bg-zinc-50 disabled:text-zinc-400 disabled:cursor-not-allowed disabled:border-zinc-200",
          error
            ? "border-red-300 bg-red-50/30 focus:ring-4 focus:ring-red-500/10 focus:border-red-500 text-zinc-900"
            : "border-zinc-200 hover:border-zinc-300 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 focus:border-zinc-900 text-zinc-900 bg-zinc-50/50",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-[11px] font-semibold text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;