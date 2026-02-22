
import React from 'react';

interface BaseProps {
  label: string;
  description?: string;
  className?: string;
}

export const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-led-cyan font-semibold text-lg mb-4 uppercase tracking-wider border-b border-led-cyan/20 pb-2">
    {children}
  </h3>
);

export const TextInput: React.FC<BaseProps & React.InputHTMLAttributes<HTMLInputElement>> = ({ label, description, className, ...props }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      {...props}
      className="w-full bg-led-panel border border-slate-700 rounded-md p-2 text-white focus:border-led-cyan focus:ring-1 focus:ring-led-cyan outline-none transition-all placeholder-slate-600"
    />
    {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
  </div>
);

export const TextAreaInput: React.FC<BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ label, description, className, ...props }) => (
  <div className={`mb-4 ${className}`}>
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <textarea
      {...props}
      rows={3}
      className="w-full bg-led-panel border border-slate-700 rounded-md p-2 text-white focus:border-led-cyan focus:ring-1 focus:ring-led-cyan outline-none transition-all placeholder-slate-600 resize-none"
    />
    {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
  </div>
);

export const SelectInput: React.FC<BaseProps & React.SelectHTMLAttributes<HTMLSelectElement> & { options: { label: string; value: string }[] }> = ({ label, options, description, ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <select
      {...props}
      className="w-full bg-led-panel border border-slate-700 rounded-md p-2 text-white focus:border-led-cyan focus:ring-1 focus:ring-led-cyan outline-none transition-all appearance-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
    {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
  </div>
);

export const SliderInput: React.FC<BaseProps & React.InputHTMLAttributes<HTMLInputElement> & { min: number; max: number; value: number }> = ({ label, value, ...props }) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <span className="text-xs font-mono text-led-cyan bg-slate-800 px-2 py-0.5 rounded">{value}</span>
    </div>
    <input
      type="range"
      {...props}
      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-led-cyan"
    />
  </div>
);

export const CheckboxGroup: React.FC<{ label: string; options: string[]; selected: string[]; onChange: (val: string[]) => void }> = ({ label, options, selected, onChange }) => {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(s => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
              selected.includes(opt)
                ? 'bg-led-cyan/20 border-led-cyan text-led-cyan'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
