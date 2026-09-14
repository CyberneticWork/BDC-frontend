import { format, isValid, parse } from 'date-fns';
import React, { useRef } from 'react';

/**
 * @typedef {Object} CustomDatePickerProps
 * @property {string} value - The current date string (YYYY-MM-DD from state).
 * @property {function} onChange - Callback function triggered on date change.
 * @property {string} [displayFormat="DD/MM/YYYY"] - Your custom display format.
 * @property {string} [error] - Error message or boolean to trigger red border.
 * 
 * @typedef {CustomDatePickerProps & Omit<React.HTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>} DatePickerProps
 */

/**
 * Reusable Date Picker Input Component
 * @param {DatePickerProps} props 
 */
const DatePickerInput = ({
    name,
    value,
    onChange,
    max,
    error,
    className = "",
    required = false,
    displayFormat = "YYYY/MM/DD",
    ...rest
}) => {
    const hiddenInputRef = useRef(null);

    const getDisplayText = () => {
        if (!value) return "";
        const parsed = parse(value, 'yyyy-MM-dd', new Date());
        const dateFnsFormat = displayFormat
          .replace(/YYYY/g, 'yyyy')
          .replace(/DD/g, 'dd');
        return isValid(parsed) ? format(parsed, dateFnsFormat) : value;
    };

    const handleTextClick = () => {
        if (hiddenInputRef.current) {
            hiddenInputRef.current.showPicker();
        }
    };

    return (
        <div className="relative w-full text-left">
            <input
                type="text"
                readOnly
                value={getDisplayText()}
                onClick={handleTextClick}
                placeholder={displayFormat.toLowerCase()}
                className={`w-full border ${error ? "border-red-500" : "border-gray-300"} 
                rounded-lg px-3 py-2.5 cursor-pointer bg-white focus:ring-2 focus:ring-blue-500 
                focus:border-transparent transition-all duration-200 ${className}`}
            />

            <input
                ref={hiddenInputRef}
                type="date"
                name={name}
                value={value || ""}
                onChange={onChange}
                max={max}
                required={required}
                className="absolute inset-0 opacity-0 pointer-events-none w-0 h-0"
                {...rest}
            />
        </div>
    );
};

export default DatePickerInput;