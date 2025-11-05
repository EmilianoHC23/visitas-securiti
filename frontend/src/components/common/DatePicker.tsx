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
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
            <CalendarIcon className="w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
          </div>
          
          <DateInput className="flex-1 pl-10 pr-20 py-2.5 border-2 border-gray-200 rounded-lg 
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
            
            <Button className="p-1 hover:bg-gray-100 rounded transition-colors">
              <CalendarIcon className="w-3.5 h-3.5 text-gray-600" />
            </Button>
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
      <div className="relative group">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
          <svg className="w-4 h-4 text-gray-400 group-focus-within:text-gray-900 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg 
                     focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent 
                     hover:border-gray-300 transition-all duration-200
                     disabled:bg-gray-100 disabled:cursor-not-allowed
                     text-gray-900 text-sm font-medium
                     [&::-webkit-calendar-picker-indicator]:cursor-pointer"
        />
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
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none z-10">
              <CalendarIcon className="w-4 h-4 text-gray-400" />
            </div>
            
            <DateInput
              slot="start"
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg 
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
              className="w-full pl-4 pr-12 py-2.5 border-2 border-gray-200 rounded-lg 
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

            <Button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors">
              <CalendarIcon className="w-3.5 h-3.5 text-gray-600" />
            </Button>
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
