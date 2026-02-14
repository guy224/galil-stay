import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays, isBefore, isAfter, isWithinInterval, parseISO, startOfDay, eachDayOfInterval, isFriday, isSaturday, isThursday } from 'date-fns';
import { CheckCircle, Search, Loader2, AlertCircle, Calendar as CalendarIcon, Users, ChevronDown, Minus, Plus, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Calendar } from '../ui/Calendar';
import { Card, CardContent } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import type { Booking, Unit, SeasonalPrice } from '../../types/supabase';

// --- Types ---
interface BookingWidgetProps {
    preselectedUnitType?: 'villa' | 'zimmer';
}

interface GuestCounts {
    adults: number;
    children: number;
    infants: number;
    pets: number;
}

// --- Helper Components ---

function Counter({ label, subLabel, value, onChange, min = 0, max }: { label: string, subLabel?: string, value: number, onChange: (val: number) => void, min?: number, max?: number }) {
    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
            <div>
                <div className="font-medium text-sm text-gray-900">{label}</div>
                {subLabel && <div className="text-xs text-gray-500">{subLabel}</div>}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onChange(value - 1)}
                    disabled={value <= min}
                    className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${value <= min ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-800'}`}
                >
                    <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-sm font-medium">{value}</span>
                <button
                    onClick={() => onChange(value + 1)}
                    disabled={max !== undefined && value >= max}
                    className={`h-8 w-8 rounded-full border flex items-center justify-center transition-colors ${max !== undefined && value >= max ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-800'}`}
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}

// --- Main Component ---

export function BookingWidget({ preselectedUnitType }: BookingWidgetProps) {
    // 1. State: Unit Selection
    const [unitType, setUnitType] = useState<'villa' | 'zimmer'>(preselectedUnitType || 'villa');

    // 2. State: Data (Fetched Once)
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
    const [unitRules, setUnitRules] = useState<Unit | null>(null);
    const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);

    // 3. State: User Input
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [guestCounts, setGuestCounts] = useState<GuestCounts>({ adults: 2, children: 0, infants: 0, pets: 0 });
    const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false); // Mobile optimized popup or inline? Let's do inline toggle for clean UI

    const guestPopoverRef = useRef<HTMLDivElement>(null);

    // 4. Effects
    // Fetch Data on Mount or Unit Change
    useEffect(() => {
        async function fetchData() {
            setIsLoadingData(true);

            // Parallel Fetch
            const [unitRes, seasonalRes, bookingsRes] = await Promise.all([
                supabase.from('units').select('*').eq('id', unitType).single(),
                supabase.from('seasonal_prices').select('*').eq('unit_id', unitType),
                supabase.from('bookings').select('*').eq('unit_type', unitType).neq('status', 'declined')
            ]);

            if (unitRes.data) setUnitRules(unitRes.data as Unit);
            if (seasonalRes.data) setSeasonalPrices(seasonalRes.data as SeasonalPrice[]);
            if (bookingsRes.data) setExistingBookings(bookingsRes.data as Booking[]);

            setIsLoadingData(false);
        }
        fetchData();
    }, [unitType]);

    // Close popover on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (guestPopoverRef.current && !guestPopoverRef.current.contains(event.target as Node)) {
                setIsGuestPopoverOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 5. Logic: Availability & Pricing

    // Check if a specific day is blocked
    const isDateBlocked = (date: Date) => {
        if (isBefore(date, addDays(new Date(), -1))) return true; // Past dates

        return existingBookings.some(b =>
            isWithinInterval(date, { start: parseISO(b.check_in), end: addDays(parseISO(b.check_out), -1) })
        );
    };

    // Calculate Total Price
    const calculation = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to || !unitRules) return null;

        const checkIn = dateRange.from;
        const checkOut = dateRange.to;
        const nightsCount = differenceInDays(checkOut, checkIn);

        if (nightsCount < 1) return null;

        // Check availability for the whole range
        const nights = eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) });
        const isRangeBlocked = nights.some(date => isDateBlocked(date));

        if (isRangeBlocked) return { error: 'dates_blocked' };

        // Check Min Nights (Simplified: check start date rule)
        // Find season for check-in
        const season = seasonalPrices.find(s =>
            isWithinInterval(checkIn, { start: parseISO(s.start_date), end: parseISO(s.end_date) })
        );
        const minNights = season ? season.min_nights : unitRules.default_min_nights;

        if (nightsCount < minNights) return { error: 'min_nights', minNights };

        // Calculate Price
        let basePriceTotal = 0;

        nights.forEach(date => {
            // 1. Seasonal
            const dailySeason = seasonalPrices.find(s =>
                isWithinInterval(date, { start: parseISO(s.start_date), end: parseISO(s.end_date) })
            );

            if (dailySeason) {
                basePriceTotal += dailySeason.price_per_night;
            } else {
                // 2. Weekend/Weekday
                if (isThursday(date) || isFriday(date) || isSaturday(date)) {
                    basePriceTotal += unitRules.base_price_weekend;
                } else {
                    basePriceTotal += unitRules.base_price_weekday;
                }
            }
        });

        // Pet Fee
        const petFee = guestCounts.pets * 50;
        const total = basePriceTotal + petFee;

        // Average nightly rate for display
        const avgNightly = Math.round(basePriceTotal / nightsCount);

        return {
            total,
            nights: nightsCount,
            avgNightly,
            petFee,
            basePriceTotal
        };

    }, [dateRange, unitRules, seasonalPrices, existingBookings, guestCounts.pets]);

    // 6. UI Helpers
    const guestLabel = `${guestCounts.adults + guestCounts.children} אורחים${guestCounts.infants > 0 ? `, ${guestCounts.infants} תינוקות` : ''}${guestCounts.pets > 0 ? `, ${guestCounts.pets} חיות` : ''}`;

    const handleBookClick = () => {
        if (calculation?.error) return;
        // In a real app, this would redirect to checkout or open a modal
        alert(`Booking request for ${unitType === 'villa' ? 'Villa' : 'Zimmer'}\nTotal: ₪${calculation?.total}`);
    };

    return (
        <Card className="w-full border-gray-100 shadow-xl bg-white rounded-2xl overflow-visible relative z-10" dir="rtl">
            <CardContent className="p-6">

                {/* 1. Unit Toggle (Home Page Mode) */}
                {!preselectedUnitType && (
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-6">
                        <button
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${unitType === 'villa' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setUnitType('villa')}
                        >
                            וילה בגליל
                        </button>
                        <button
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${unitType === 'zimmer' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            onClick={() => setUnitType('zimmer')}
                        >
                            צימר בין הנחלים
                        </button>
                    </div>
                )}

                {/* 2. Header: Price */}
                <div className="flex items-end justify-between mb-5">
                    <div>
                        {isLoadingData ? (
                            <div className="h-8 w-24 bg-gray-100 animate-pulse rounded"></div>
                        ) : (
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900">
                                    ₪{calculation?.avgNightly ? calculation.avgNightly.toLocaleString() : (unitType === 'villa' ? '2,500' : '1,200')}
                                </span>
                                <span className="text-gray-500 text-sm">/ לילה</span>
                            </div>
                        )}
                    </div>
                    {/* Could add reviews here if available */}
                </div>

                {/* 3. Input Grid */}
                <div className="border border-gray-200 rounded-xl mb-4 relative">
                    {/* Rows */}
                    <div className="flex border-b border-gray-200">
                        <div className="flex-1 p-3 border-l border-gray-200 relative hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
                            <label className="block text-[10px] font-bold text-gray-800 uppercase tracking-wider">צ'ק-אין</label>
                            <div className={`text-sm ${dateRange?.from ? 'text-gray-900' : 'text-gray-400'}`}>
                                {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'בחר תאריך'}
                            </div>
                        </div>
                        <div className="flex-1 p-3 relative hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
                            <label className="block text-[10px] font-bold text-gray-800 uppercase tracking-wider">צ'ק-אאוט</label>
                            <div className={`text-sm ${dateRange?.to ? 'text-gray-900' : 'text-gray-400'}`}>
                                {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'בחר תאריך'}
                            </div>
                        </div>
                    </div>

                    {/* Guest Picker Trigger */}
                    <div
                        className="p-3 relative hover:bg-gray-50 transition-colors cursor-pointer rounded-b-xl"
                        onClick={() => setIsGuestPopoverOpen(!isGuestPopoverOpen)}
                    >
                        <div className="flex justify-between items-center">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-800 uppercase tracking-wider">אורחים</label>
                                <div className="text-sm text-gray-900">{guestLabel}</div>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isGuestPopoverOpen ? 'rotate-180' : ''}`} />
                        </div>
                    </div>

                    {/* Popover: Calendar */}
                    {isCalendarOpen && (
                        <div className="absolute top-[calc(100%+8px)] right-0 left-0 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold">בחר תאריכים</span>
                                <button onClick={() => setIsCalendarOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={1}
                                disabled={isDateBlocked}
                                className="w-full"
                                classNames={{
                                    head_cell: "text-gray-400 w-9 font-normal text-[0.8rem]",
                                    day: "h-9 w-9 p-0 font-normal hover:bg-gray-100 rounded-md transition-colors aria-selected:opacity-100",
                                    day_selected: "bg-black text-white hover:bg-black hover:text-white focus:bg-black focus:text-white",
                                    day_today: "bg-gray-100 text-gray-900",
                                    day_outside: "text-gray-300 opacity-50",
                                    day_disabled: "text-gray-300 opacity-50 decoration-slate-400 line-through",
                                    day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
                                }}
                            />
                            <div className="text-right mt-2">
                                <Button size="sm" className="w-full" onClick={() => setIsCalendarOpen(false)}>סגור</Button>
                            </div>
                        </div>
                    )}

                    {/* Popover: Guests */}
                    {isGuestPopoverOpen && (
                        <div ref={guestPopoverRef} className="absolute top-[calc(100%+8px)] right-0 left-0 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-5 animate-in fade-in slide-in-from-top-2">
                            <Counter
                                label="מבוגרים"
                                subLabel="גיל 13 ומעלה"
                                value={guestCounts.adults}
                                onChange={(val) => setGuestCounts({ ...guestCounts, adults: val })}
                                min={1}
                                max={unitType === 'villa' ? 15 : 4} // simplistic cap
                            />
                            <Counter
                                label="ילדים"
                                subLabel="גילאים 2-12"
                                value={guestCounts.children}
                                onChange={(val) => setGuestCounts({ ...guestCounts, children: val })}
                                min={0}
                                max={10}
                            />
                            <Counter
                                label="תינוקות"
                                subLabel="מתחת לגיל 2"
                                value={guestCounts.infants}
                                onChange={(val) => setGuestCounts({ ...guestCounts, infants: val })}
                                min={0}
                            />
                            <Counter
                                label="חיות מחמד"
                                subLabel="₪50 תוספת לניקיון"
                                value={guestCounts.pets}
                                onChange={(val) => setGuestCounts({ ...guestCounts, pets: val })}
                                min={0}
                            />
                            <div className="text-xs text-gray-400 mt-4 text-center">
                                המקום מאפשר אירוח של עד {unitType === 'villa' ? 15 : 4} אורחים (לא כולל תינוקות).
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Action Button */}
                <Button
                    className={`w-full h-12 text-lg font-bold shadow-lg transition-all rounded-xl ${unitType === 'villa' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'}`}
                    onClick={handleBookClick}
                    disabled={isLoadingData || calculation?.error === 'dates_blocked' || calculation?.error === 'min_nights'}
                >
                    {isLoadingData ? (
                        <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    ) : calculation ? (
                        calculation.error ? 'תאריכים אלו תפוסים' : 'הזמן חופשה'
                    ) : (
                        'בדוק זמינות'
                    )}
                </Button>

                {/* 5. Pricing Breakdown & Messages */}
                {calculation && !calculation.error && (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="text-center text-sm text-gray-500 mb-4">
                            לא תחויבו עדיין
                        </div>

                        <div className="flex justify-between text-gray-600 text-sm">
                            <span className="underline decoration-dotted">₪{calculation.avgNightly.toLocaleString()} x {calculation.nights} לילות</span>
                            <span>₪{calculation.basePriceTotal.toLocaleString()}</span>
                        </div>

                        {calculation.petFee > 0 && (
                            <div className="flex justify-between text-gray-600 text-sm">
                                <span className="underline decoration-dotted">דמי ניקיון חיות מחמד</span>
                                <span>₪{calculation.petFee.toLocaleString()}</span>
                            </div>
                        )}

                        <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-lg">
                            <span>סה"כ</span>
                            <span>₪{calculation.total.toLocaleString()}</span>
                        </div>
                    </div>
                )}

                {/* 6. Availability Errors */}
                {calculation?.error === 'dates_blocked' && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        חלק מהתאריכים שבחרתם תפוסים.
                    </div>
                )}

                {calculation?.error === 'min_nights' && (
                    <div className="mt-4 p-3 bg-orange-50 text-orange-700 text-sm rounded-lg flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        מינימום {calculation.minNights} לילות בתאריכים אלו.
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
