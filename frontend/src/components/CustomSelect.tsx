import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface CustomSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  options: CustomSelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  disabled?: boolean;
  invalid?: boolean;
  leadingIcon?: React.ElementType;
  className?: string;
  buttonClassName?: string;
  accent?: 'primary' | 'secondary';
}

type MenuPosition = { left: number; top: number; width: number; maxHeight: number };

const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  placeholder = 'Chọn một mục',
  ariaLabel,
  disabled = false,
  invalid = false,
  leadingIcon: LeadingIcon,
  className = '',
  buttonClassName = '',
  accent = 'primary',
}) => {
  const selectId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<MenuPosition>({ left: 0, top: 0, width: 0, maxHeight: 288 });
  const selectedOption = useMemo(() => options.find(option => option.value === value), [options, value]);
  const accentClasses = accent === 'secondary'
    ? 'focus-visible:border-secondary focus-visible:ring-secondary/15'
    : 'focus-visible:border-primary focus-visible:ring-primary/15';
  const openClasses = accent === 'secondary'
    ? 'border-secondary ring-2 ring-secondary/15'
    : 'border-primary ring-2 ring-primary/15';

  const firstEnabledIndex = () => options.findIndex(option => !option.disabled);
  const lastEnabledIndex = () => {
    for (let index = options.length - 1; index >= 0; index--) {
      if (!options[index].disabled) return index;
    }
    return -1;
  };

  const moveActive = (direction: 1 | -1) => {
    if (options.length === 0) return;
    let next = activeIndex;
    for (let attempts = 0; attempts < options.length; attempts++) {
      next = (next + direction + options.length) % options.length;
      if (!options[next].disabled) {
        setActiveIndex(next);
        return;
      }
    }
  };

  const updatePosition = useCallback(() => {
    const trigger = buttonRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 12;
    const estimatedHeight = Math.min(288, options.length * 44 + 16);
    const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
    const availableAbove = rect.top - viewportPadding;
    const openAbove = availableBelow < Math.min(estimatedHeight, 180) && availableAbove > availableBelow;
    const availableHeight = openAbove ? availableAbove : availableBelow;
    const maxHeight = Math.max(96, Math.min(288, availableHeight - 6));
    const renderedHeight = Math.min(estimatedHeight, maxHeight);
    const width = Math.min(Math.max(rect.width, 220), window.innerWidth - viewportPadding * 2);
    const left = Math.min(Math.max(viewportPadding, rect.left), window.innerWidth - width - viewportPadding);
    const top = openAbove
      ? Math.max(viewportPadding, rect.top - renderedHeight - 6)
      : rect.bottom + 6;
    setPosition({ left, top, width, maxHeight });
  }, [options.length]);

  const openMenu = () => {
    if (disabled || options.length === 0) return;
    const selectedIndex = options.findIndex(option => option.value === value && !option.disabled);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : firstEnabledIndex());
    updatePosition();
    setOpen(true);
  };

  const choose = (option: CustomSelectOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!buttonRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    const handleViewportChange = () => updatePosition();
    document.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    document.getElementById(`${selectId}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open, selectId]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) openMenu();
      else moveActive(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(firstEnabledIndex());
      return;
    }
    if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(lastEnabledIndex());
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) choose(option);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openMenu();
      return;
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (event.key === 'Tab' && open) setOpen(false);
  };

  const menu = open && typeof document !== 'undefined' ? createPortal(
    <div
      ref={menuRef}
      id={`${selectId}-listbox`}
      role="listbox"
      aria-label={ariaLabel}
      className="fixed z-[260] max-h-72 overflow-y-auto rounded-lg border border-outline-variant/55 bg-surface-container-lowest p-1.5 shadow-[0_18px_45px_rgba(19,27,46,0.18)]"
      style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight }}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        const active = index === activeIndex;
        return (
          <button
            type="button"
            key={`${option.value}-${index}`}
            id={`${selectId}-option-${index}`}
            role="option"
            aria-selected={selected}
            disabled={option.disabled}
            onMouseEnter={() => !option.disabled && setActiveIndex(index)}
            onClick={() => choose(option)}
            className={`grid min-h-10 w-full grid-cols-[minmax(0,1fr)_20px] items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition ${
              active ? 'bg-primary/[0.08] text-primary' : 'text-on-surface hover:bg-surface-container-low'
            } ${option.disabled ? 'cursor-not-allowed opacity-40' : ''}`}
          >
            <span className={`truncate ${selected ? 'font-extrabold' : 'font-semibold'}`}>{option.label}</span>
            {selected && <Check className="h-4 w-4 text-primary" />}
          </button>
        );
      })}
    </div>,
    document.body,
  ) : null;

  return (
    <div className={`min-w-0 ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        aria-controls={`${selectId}-listbox`}
        aria-activedescendant={open && activeIndex >= 0 ? `${selectId}-option-${activeIndex}` : undefined}
        disabled={disabled}
        onClick={() => open ? setOpen(false) : openMenu()}
        onKeyDown={handleKeyDown}
        className={`flex h-11 w-full min-w-0 items-center gap-2.5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-3.5 text-left text-sm shadow-sm outline-none transition hover:border-outline focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${accentClasses} ${open ? openClasses : ''} ${buttonClassName} ${invalid ? 'border-error ring-2 ring-error/15' : ''}`}
      >
        {LeadingIcon && <LeadingIcon className="h-4 w-4 shrink-0 text-outline" />}
        <span className={`min-w-0 flex-1 truncate ${selectedOption ? 'font-semibold text-on-surface' : 'font-normal text-on-surface-variant/60'}`}>{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </div>
  );
};

export default CustomSelect;
