import React from 'react';
import { Calendar as CalendarIcon, X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DatePicker as AriaDatePicker,
  DateRangePicker as AriaDateRangePicker,
  DateInput,
  DateSegment,
  Button,
  Calendar,
  CalendarGrid,
  CalendarCell,
  Heading,
  Dialog,
  Popover,
  Group,
  Label,
  type DateValue,
  RangeCalendar,
} from 'react-aria-components';
import { parseDate, today, getLocalTimeZone } from '@internationalized/date';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  className?: string;
  showClearButton?: boolean;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  min,
  max,
  className = '',
  showClearButton = true,
  disabled = false,
}) => {
  // Convert string date to DateValue
  const dateValue: DateValue | null = value ? parseDate(value) : null;
  
  const handleChange = (newValue: DateValue | null) => {
    if (newValue) {
      onChange(newValue.toString());
    } else {
      onChange('');
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const minDate = min ? parseDate(min) : undefined;
  const maxDate = max ? parseDate(max) : undefined;

  return (
    <div className={className}>
      <AriaDatePicker
        value={dateValue}
        onChange={handleChange}
        isDisabled={disabled}
        isRequired={required}
        minValue={minDate}
        maxValue={maxDate}
        granularity="day"
      >
        {label && (
          <Label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
            <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        )}
        
        <Group className="relative inline-flex w-full items-center">
          <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
            <Button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <CalendarIcon className="w-3.5 h-3.5 text-gray-600" />
            </Button>
          </div>
          
          <DateInput className="flex-1 pl-9 pr-8 py-2 border-2 border-gray-200 rounded-lg 
                               focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent 
                               hover:border-gray-300 transition-all duration-200
                               disabled:bg-gray-100 disabled:cursor-not-allowed
                               text-gray-900 text-sm font-medium flex items-center gap-0.5">
            {(segment) => (
              <DateSegment
                segment={segment}
                className="px-0.5 tabular-nums outline-none rounded-sm focus:bg-gray-900 focus:text-white data-[placeholder]:text-gray-400 text-sm"
              />
            )}
          </DateInput>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {showClearButton && value && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-0.5 hover:bg-gray-100"
                title="Limpiar fecha"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </Group>

        <Popover className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 mt-2">
          <Dialog className="outline-none">
            <Calendar className="w-full">
              <header className="flex items-center justify-between mb-2">
                <Button
                  slot="previous"
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-gray-700" />
                </Button>
                <Heading className="text-sm font-bold text-gray-900" />
                <Button
                  slot="next"
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
                </Button>
              </header>
              <CalendarGrid className="border-spacing-0.5 border-separate">
                {(date) => (
                  <CalendarCell
                    date={date}
                    className="w-8 h-8 text-xs rounded-md flex items-center justify-center
                             cursor-pointer hover:bg-gray-100 transition-colors
                             data-[selected]:bg-gray-900 data-[selected]:text-white data-[selected]:font-semibold
                             data-[disabled]:text-gray-300 data-[disabled]:cursor-not-allowed
                             data-[outside-month]:text-gray-400
                             data-[focused]:ring-1 data-[focused]:ring-gray-900"
                  />
                )}
              </CalendarGrid>
            </Calendar>
          </Dialog>
        </Popover>
      </AriaDatePicker>
    </div>
  );
};

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value,
  onChange,
  label,
  required = false,
  className = '',
  disabled = false,
}) => {
  const [hours, minutes] = value.split(':').map(v => v || '00');
  const [isOpen, setIsOpen] = React.useState(false);

  const updateTime = (newHours: string, newMinutes: string) => {
    onChange(`${newHours}:${newMinutes}`);
  };

  const incrementHours = () => {
    const h = parseInt(hours);
    const newHours = ((h + 1) % 24).toString().padStart(2, '0');
    updateTime(newHours, minutes);
  };

  const decrementHours = () => {
    const h = parseInt(hours);
    const newHours = ((h - 1 + 24) % 24).toString().padStart(2, '0');
    updateTime(newHours, minutes);
  };

  const incrementMinutes = () => {
    const m = parseInt(minutes);
    const newMinutes = ((m + 15) % 60).toString().padStart(2, '0');
    const shouldIncrementHour = m + 15 >= 60;
    if (shouldIncrementHour) {
      const h = parseInt(hours);
      const newHours = ((h + 1) % 24).toString().padStart(2, '0');
      updateTime(newHours, newMinutes);
    } else {
      updateTime(hours, newMinutes);
    }
  };

  const decrementMinutes = () => {
    const m = parseInt(minutes);
    const newMinutes = ((m - 15 + 60) % 60).toString().padStart(2, '0');
    const shouldDecrementHour = m - 15 < 0;
    if (shouldDecrementHour) {
      const h = parseInt(hours);
      const newHours = ((h - 1 + 24) % 24).toString().padStart(2, '0');
      updateTime(newHours, newMinutes);
    } else {
      updateTime(hours, newMinutes);
    }
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') val = '00';
    if (parseInt(val) > 23) val = '23';
    updateTime(val.padStart(2, '0'), minutes);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val === '') val = '00';
    if (parseInt(val) > 59) val = '59';
    updateTime(hours, val.padStart(2, '0'));
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Display Button */}
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent 
                     hover:border-gray-300 transition-all duration-200
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-gray-900 text-base font-semibold
                     flex items-center justify-between group"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-2xl font-bold tracking-wider">{hours}:{minutes}</span>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Picker Dropdown */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-2 w-full bg-white rounded-xl shadow-2xl border-2 border-gray-200 p-4">
            <div className="flex items-center justify-center space-x-4">
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementHours}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 
                           active:bg-gray-200 transition-colors duration-150 group"
                >
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={hours}
                  onChange={handleHourChange}
                  className="w-16 h-16 text-center text-3xl font-bold text-gray-900 
                           border-2 border-gray-300 rounded-xl my-2
                           focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                           transition-all duration-200"
                  maxLength={2}
                />
                <button
                  type="button"
                  onClick={decrementHours}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 
                           active:bg-gray-200 transition-colors duration-150 group"
                >
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span className="text-xs font-semibold text-gray-500 mt-1">HORAS</span>
              </div>

              {/* Separator */}
              <span className="text-4xl font-bold text-gray-400 pb-6">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementMinutes}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 
                           active:bg-gray-200 transition-colors duration-150 group"
                >
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <input
                  type="text"
                  value={minutes}
                  onChange={handleMinuteChange}
                  className="w-16 h-16 text-center text-3xl font-bold text-gray-900 
                           border-2 border-gray-300 rounded-xl my-2
                           focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                           transition-all duration-200"
                  maxLength={2}
                />
                <button
                  type="button"
                  onClick={decrementMinutes}
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 
                           active:bg-gray-200 transition-colors duration-150 group"
                >
                  <svg className="w-6 h-6 text-gray-600 group-hover:text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <span className="text-xs font-semibold text-gray-500 mt-1">MINUTOS</span>
              </div>
            </div>

            {/* Quick Time Options */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-2">
                {['09:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      onChange(time);
                      setIsOpen(false);
                    }}
                    className="px-3 py-2 text-sm font-semibold text-gray-700 bg-gray-100 
                             hover:bg-gray-900 hover:text-white rounded-lg transition-colors duration-150"
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            {/* Done Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-4 w-full py-2.5 bg-gray-900 text-white font-semibold rounded-lg 
                       hover:bg-gray-800 transition-colors duration-150"
            >
              Confirmar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// DateRangePicker Component
interface DateRangePickerProps {
  startValue: string;
  endValue: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  startLabel?: string;
  endLabel?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  startLabel = 'Desde',
  endLabel = 'Hasta',
  className = '',
  disabled = false,
  required = false,
}) => {
  const startDateValue: DateValue | null = startValue ? parseDate(startValue) : null;
  const endDateValue: DateValue | null = endValue ? parseDate(endValue) : null;

  const rangeValue = startDateValue && endDateValue ? { start: startDateValue, end: endDateValue } : null;

  const handleRangeChange = (newValue: { start: DateValue; end: DateValue } | null) => {
    if (newValue) {
      onStartChange(newValue.start.toString());
      onEndChange(newValue.end.toString());
    } else {
      onStartChange('');
      onEndChange('');
    }
  };

  return (
    <div className={className}>
      <AriaDateRangePicker
        value={rangeValue}
        onChange={handleRangeChange}
        isDisabled={disabled}
        isRequired={required}
      >
        <Label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
          <CalendarIcon className="w-4 h-4 mr-2 text-gray-500" />
          Rango de Fechas
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <Group className="relative flex-1 inline-flex items-center">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center">
              <Button className="p-1 hover:bg-gray-100 rounded transition-colors">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-600" />
              </Button>
            </div>
            
            <DateInput
              slot="start"
              className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg 
                       focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent 
                       hover:border-gray-300 transition-all duration-200
                       text-gray-900 text-sm font-medium flex items-center gap-0.5"
            >
              {(segment) => (
                <DateSegment
                  segment={segment}
                  className="px-0.5 tabular-nums outline-none rounded-sm focus:bg-gray-900 focus:text-white data-[placeholder]:text-gray-400 text-sm"
                />
              )}
            </DateInput>
          </Group>

          <span className="text-gray-500 text-sm font-medium text-center sm:text-left hidden sm:block">-</span>

          <Group className="relative flex-1 inline-flex items-center">
            <DateInput
              slot="end"
              className="w-full pl-3 pr-3 py-2 border-2 border-gray-200 rounded-lg 
                       focus-within:outline-none focus-within:ring-2 focus-within:ring-gray-900 focus-within:border-transparent 
                       hover:border-gray-300 transition-all duration-200
                       text-gray-900 text-sm font-medium flex items-center gap-0.5"
            >
              {(segment) => (
                <DateSegment
                  segment={segment}
                  className="px-0.5 tabular-nums outline-none rounded-sm focus:bg-gray-900 focus:text-white data-[placeholder]:text-gray-400 text-sm"
                />
              )}
            </DateInput>
          </Group>
        </div>

        <Popover className="bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 mt-2">
          <Dialog className="outline-none">
            <RangeCalendar className="w-full">
              <header className="flex items-center justify-between mb-2">
                <Button
                  slot="previous"
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-gray-700" />
                </Button>
                <Heading className="text-sm font-bold text-gray-900" />
                <Button
                  slot="next"
                  className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-gray-700" />
                </Button>
              </header>
              <CalendarGrid className="border-spacing-0.5 border-separate">
                {(date) => (
                  <CalendarCell
                    date={date}
                    className="w-8 h-8 text-xs rounded-md flex items-center justify-center
                             cursor-pointer hover:bg-gray-100 transition-colors
                             data-[selected]:bg-gray-900 data-[selected]:text-white data-[selected]:font-semibold
                             data-[selection-start]:bg-gray-900 data-[selection-start]:text-white
                             data-[selection-end]:bg-gray-900 data-[selection-end]:text-white
                             data-[disabled]:text-gray-300 data-[disabled]:cursor-not-allowed
                             data-[outside-month]:text-gray-400
                             data-[focused]:ring-1 data-[focused]:ring-gray-900"
                  />
                )}
              </CalendarGrid>
            </RangeCalendar>
          </Dialog>
        </Popover>
      </AriaDateRangePicker>
    </div>
  );
};
