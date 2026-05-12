import { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 mb-1">{label}</label>
      )}
      <input
        className={clsx(
          'w-full px-4 py-3 border border-neutral-300 rounded-2xl bg-white text-neutral-900 placeholder-neutral-400',
          'focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all duration-200',
          'hover:border-neutral-400',
          error && 'border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
