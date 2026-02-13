import React, { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    isWithinInterval,
    parseISO,
    addMonths,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Booking } from '../../types/supabase';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

interface DashboardCalendarProps {
    bookings: Booking[];
    selectedDate: Date | null;
    onSelectDate: (date: Date | null) => void;
}

export function DashboardCalendar({ bookings, selectedDate, onSelectDate }: DashboardCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const startDate = startOfWeek(startOfMonth(currentMonth));
    const endDate = endOfWeek(endOfMonth(currentMonth));
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const resetToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        onSelectDate(today);
    };

    const getDayStatus = (date: Date) => {
        const dayBookings = bookings.filter(b =>
            b.status === 'approved' &&
            isWithinInterval(date, {
                start: parseISO(b.check_in),
                end: parseISO(b.check_out)
            })
        );

        if (dayBookings.length === 0) return 'free';

        // Check if it's a start or end date
        const isStart = dayBookings.some(b => isSameDay(parseISO(b.check_in), date));
        const isEnd = dayBookings.some(b => isSameDay(parseISO(b.check_out), date));

        if (isStart && isEnd) return 'overlap'; // Check-out and Check-in on same day
        if (isStart) return 'start';
        if (isEnd) return 'end';
        return 'booked';
    };

    const handleDateClick = (date: Date) => {
        if (selectedDate && isSameDay(selectedDate, date)) {
            onSelectDate(null); // Deselect
        } else {
            onSelectDate(date);
        }
    };

    return (
        <Card className="h-full border-none shadow-sm bg-white overflow-hidden flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-4 border-b bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold text-gray-900">
                        {format(currentMonth, 'MMMM yyyy')}
                    </CardTitle>
                </div>
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={prevMonth} className="h-8 w-8 p-0">
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={resetToday} className="text-xs h-8">
                        היום
                    </Button>
                    <Button variant="ghost" size="sm" onClick={nextMonth} className="h-8 w-8 p-0">
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="p-4 flex-1 overflow-y-auto">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 mb-2 text-center">
                    {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map((day) => (
                        <div key={day} className="text-xs font-semibold text-gray-400 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-2">
                    {days.map((day, dayIdx) => {
                        const status = getDayStatus(day);
                        const isSelected = selectedDate && isSameDay(day, selectedDate);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <button
                                key={day.toString()}
                                onClick={() => handleDateClick(day)}
                                className={`
                                    relative h-14 rounded-lg flex flex-col items-center justify-center text-sm transition-all border
                                    ${!isCurrentMonth ? 'text-gray-300 bg-gray-50/30' : 'text-gray-700'}
                                    ${isSelected ? 'ring-2 ring-primary ring-offset-2 z-10' : ''}
                                    ${isToday && !isSelected ? 'border-primary/30 font-bold bg-primary/5' : ''}
                                    ${!isSelected && !isToday ? 'border-transparent hover:bg-gray-50' : ''}
                                    ${status === 'booked' ? 'bg-red-50 text-red-900' : ''}
                                `}
                            >
                                <span className="z-10">{format(day, 'd')}</span>

                                {/* Status Indicators */}
                                <div className="absolute inset-0 rounded-lg overflow-hidden opacity-20">
                                    {status === 'booked' && <div className="w-full h-full bg-red-500" />}
                                    {status === 'start' && <div className="w-full h-full bg-gradient-to-l from-red-500 to-transparent" />}
                                    {status === 'end' && <div className="w-full h-full bg-gradient-to-r from-red-500 to-transparent" />}
                                    {status === 'overlap' && (
                                        <div className="w-full h-full flex">
                                            <div className="w-1/2 bg-red-500" />
                                            <div className="w-1/2 bg-red-500 opacity-50" />
                                        </div>
                                    )}
                                </div>

                                {status !== 'free' && (
                                    <div className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-red-500" />
                                )}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6 flex flex-col gap-2 text-xs text-gray-400 px-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span>תפוס מלא</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-transparent border border-primary/30" />
                        <span>פנוי</span>
                    </div>
                </div>

            </CardContent>
        </Card>
    );
}
