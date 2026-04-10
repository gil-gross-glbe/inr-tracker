import React from 'react';
import { Pill, Droplet, TrendingUp } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white border border-borderLight rounded-[14px] p-3.5 mb-3 shadow-sm ${className}`}>
    {children}
  </div>
);

export const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-[11px] font-medium text-textMuted uppercase tracking-wide mb-2">
    {children}
  </div>
);

export const ButtonPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button 
    className={`w-full py-[11px] px-3 bg-primary text-white border-none rounded-xl text-sm font-medium focus:outline-none active:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const ButtonSecondary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button 
    className={`w-full py-2.5 px-3 bg-successBg text-primary border-none rounded-xl text-[13px] font-medium focus:outline-none active:opacity-90 transition-opacity disabled:opacity-50 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const OutlinedButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...props }) => (
  <button 
    className={`w-full py-2 px-3 bg-screenBg text-textMain border border-borderDark rounded-xl text-[13px] font-medium flex items-center justify-center gap-1.5 focus:outline-none active:bg-gray-100 transition-colors ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> & { as?: 'input' | 'textarea' }> = ({ className = '', as: Component = 'input', ...props }) => {
  return (

    <Component 
      className={`w-full box-border py-[7px] px-2.5 border border-borderDark rounded-lg text-[13px] bg-white text-textMain focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:text-textMuted ${className}`}
      {...props}
    />
  );
};

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement> & { rightText?: React.ReactNode }> = ({ children, className = '', rightText, ...props }) => (
  <div className="flex justify-between items-baseline mb-1">
    <label className={`block text-xs text-textMuted ${className}`} {...props}>
      {children}
    </label>
    {rightText && <div className="text-[11px] text-primary">{rightText}</div>}
  </div>
);

export const Badge: React.FC<{ variant: 'green' | 'orange' | 'red', children: React.ReactNode }> = ({ variant, children }) => {
  let classes = '';
  if (variant === 'green') classes = 'bg-successBg text-primary';
  if (variant === 'orange') classes = 'bg-warningBg text-warning';
  if (variant === 'red') classes = 'bg-dangerBg text-danger';

  return (
    <span className={`inline-block px-2 py-1 rounded-md text-[11px] font-medium ${classes}`}>
      {children}
    </span>
  );
};

interface TabBarProps {
  activeTab: 'pill' | 'inr' | 'predict';
  onTabChange: (tab: 'pill' | 'inr' | 'predict') => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'pill', label: 'Pill', icon: Pill },
    { id: 'inr', label: 'INR', icon: Droplet },
    { id: 'predict', label: 'Predict', icon: TrendingUp },
  ] as const;

  return (
    <div className="flex border-b border-borderLight bg-white sticky top-0 z-10 w-full max-w-md mx-auto">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2.5 px-1 flex flex-col items-center gap-1 border-b-2 text-[11px] transition-colors focus:outline-none ${
              isActive 
                ? 'text-primary border-primary font-medium bg-gray-50/50' 
                : 'text-textMuted border-transparent hover:text-textSub'
            }`}
          >
            <Icon size={18} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
