import React from 'react';
import { DayPicker } from 'react-day-picker';
import { he } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import 'react-day-picker/dist/style.css';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            locale={he}
            dir="rtl"
            showOutsideDays={showOutsideDays}
            className={cn("p-0", className)}
            classNames={{
                months: "flex flex-col",
                month: "space-y-4 w-full",
                caption: "flex justify-center items-center relative mb-4",
                caption_label: "text-base font-bold text-slate-900",
                nav: "flex items-center gap-1",
                nav_button: cn(
                    "h-8 w-8 bg-transparent p-0 hover:bg-slate-100 rounded-full transition-colors flex items-center justify-center"
                ),
                nav_button_previous: "absolute left-0",
                nav_button_next: "absolute right-0",
                table: "w-full border-collapse",
                head_row: "flex w-full mb-2",
                head_cell: "text-slate-400 font-medium text-xs w-10 h-10 flex items-center justify-center uppercase",
                row: "flex w-full",
                cell: cn(
                    "relative p-0 text-center focus-within:relative focus-within:z-20",
                    // Range selection styling
                    "[&:has([aria-selected].day-range-end)]:rounded-l-full",
                    "[&:has([aria-selected].day-range-start)]:rounded-r-full",
                    "[&:has([aria-selected])]:bg-slate-100"
                ),
                day: cn(
                    "h-10 w-10 p-0 font-normal text-sm rounded-full",
                    "hover:bg-slate-100 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
                ),
                day_range_start: "!bg-slate-900 !text-white hover:!bg-slate-900 rounded-full day-range-start",
                day_range_end: "!bg-slate-900 !text-white hover:!bg-slate-900 rounded-full day-range-end",
                day_selected: "bg-slate-900 text-white hover:bg-slate-900 rounded-full",
                day_today: "relative font-bold after:content-[''] after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-slate-900 after:rounded-full",
                day_outside: "text-slate-300 opacity-50",
                day_disabled: "text-slate-300 opacity-30 cursor-not-allowed hover:bg-transparent",
                day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900 rounded-none",
                day_hidden: "invisible",
                ...classNames,
            }}
            components={{
                IconLeft: () => <ChevronRight className="h-4 w-4 text-slate-600" />,
                IconRight: () => <ChevronLeft className="h-4 w-4 text-slate-600" />,
            }}
            {...props}
        />
    );
}
