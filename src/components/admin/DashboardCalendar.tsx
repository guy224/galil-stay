import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, parseISO, isWithinInterval } from 'date-fns';
import { he } from 'date-fns/locale';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon } from 'lucide-react';
import type { Booking } from '../../types/supabase';
import { Button } from '../../components/ui/Button';

interface DashboardCalendarProps {
    bookings: Booking[];
    onSelectDate?: (date: Date | null) => void;
    selectedDate?: Date | null;
}

export function DashboardCalendar({ bookings, onSelectDate, selectedDate }: DashboardCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Calculate empty cells for start of month
    // Sunday is 0, Monday is 1, etc.
    // We want Sunday to be the first column (RTL or standard grid)
    const startDay = getDay(monthStart);
    const emptyDays = Array(startDay).fill(null);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const getDayStatus = (date: Date) => {
        // Filter bookings for this day
        const dayBookings = bookings.filter(b => {
            if (b.status === 'declined') return false;
            const start = parseISO(b.check_in);
            const end = parseISO(b.check_out);
            return isWithinInterval(date, { start, end });
        });

        if (dayBookings.length === 0) return 'empty';
        if (dayBookings.some(b => b.unit_type === 'villa')) return 'villa';
        if (dayBookings.some(b => b.unit_type === 'zimmer')) return 'zimmer';
        // If both? rare case, prioritize villa or show mixed color
        return 'mixed';
    };

    const handleDateClick = (date: Date) => {
        if (onSelectDate) {
            if (selectedDate && isSameDay(date, selectedDate)) {
                onSelectDate(null); // Deselect
            } else {
                onSelectDate(date);
            }
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    {format(currentMonth, 'MMMM yyyy', { locale: he })}
                </h2>
                <div className="flex gap-1" dir="ltr"> {/* Reverse direction for buttons to feel natural prev/next */}
                    <Button variant="ghost" size="sm" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
                {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
                    <div key={day} className="text-gray-400 font-medium text-xs py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {emptyDays.map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {monthDays.map((day, i) => {
                    const status = getDayStatus(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, new Date());

                    let bgClass = "hover:bg-gray-100/50";
                    let textClass = "text-gray-700";

                    if (isSelected) {
                        bgClass = "bg-primary text-white hover:bg-primary/90 shadow-md ring-2 ring-primary/20 scale-105 z-10";
                        textClass = "text-white font-bold";
                    } else if (status === 'villa') {
                        bgClass = "bg-blue-50 hover:bg-blue-100 border border-blue-100";
                        textClass = "text-blue-700 font-medium";
                    } else if (status === 'zimmer') {
                        bgClass = "bg-green-50 hover:bg-green-100 border border-green-100";
                        textClass = "text-green-700 font-medium";
                    } else if (status === 'mixed') {
                        bgClass = "bg-purple-50 hover:bg-purple-100 border border-purple-100";
                        textClass = "text-purple-700 font-medium";
                    }

                    if (isToday && !isSelected) {
                        textClass += " text-primary font-bold";
                        bgClass += " ring-1 ring-primary/30";
                    }

                    return (
                        <button
                            key={i}
                            onClick={() => handleDateClick(day)}
                            className={`
                                aspect-square rounded-lg flex flex-col items-center justify-center
                                transition-all duration-200 text-sm relative group
                                ${bgClass}
                                ${textClass}
                            `}
                        >
                            <span>{format(day, 'd')}</span>
                            <div className="flex gap-0.5 mt-1 h-1.5">
                                {status === 'villa' && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                {status === 'zimmer' && <div className="w-1.5 h-1.5 rounded-full bg-green-400" />}
                                {status === 'mixed' && (
                                    <>
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                    </>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 justify-center border-t pt-3">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span>וילה</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    <span>צימר</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full border border-gray-300" />
                    <span>פנוי</span>
                </div>
            </div>
        </div>
    );
}
