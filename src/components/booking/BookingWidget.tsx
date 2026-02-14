import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays, isBefore, isWithinInterval, parseISO, eachDayOfInterval, isFriday, isSaturday, isThursday } from 'date-fns';
import { CheckCircle, Loader2, AlertCircle, Calendar as CalendarIcon, ChevronDown, Minus, Plus, X, ArrowLeft, ArrowRight, User, Phone, Edit2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Calendar } from '../ui/Calendar';
import { Card, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
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
        <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
                <div className="font-medium text-sm text-gray-900">{label}</div>
                {subLabel && <div className="text-[10px] text-gray-500">{subLabel}</div>}
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={() => onChange(value - 1)}
                    disabled={value <= min}
                    className={`h-7 w-7 rounded-full border flex items-center justify-center transition-colors ${value <= min ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-800'}`}
                >
                    <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center text-sm font-medium">{value}</span>
                <button
                    onClick={() => onChange(value + 1)}
                    disabled={max !== undefined && value >= max}
                    className={`h-7 w-7 rounded-full border flex items-center justify-center transition-colors ${max !== undefined && value >= max ? 'border-gray-100 text-gray-300 cursor-not-allowed' : 'border-gray-300 text-gray-600 hover:border-gray-800 hover:text-gray-800'}`}
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
}

// --- Main Component ---
export function BookingWidget({ preselectedUnitType }: BookingWidgetProps) {
    // Stage Management
    const [step, setStep] = useState<'search' | 'summary' | 'form'>('search');
    const [isCalculating, setIsCalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State: Unit Selection
    const [unitType, setUnitType] = useState<'villa' | 'zimmer'>(preselectedUnitType || 'villa');

    // State: Data (Fetched Once)
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
    const [unitRules, setUnitRules] = useState<Unit | null>(null);
    const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);

    // State: User Input
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [guestCounts, setGuestCounts] = useState<GuestCounts>({ adults: 2, children: 0, infants: 0, pets: 0 });
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // UI State
    const [isGuestPopoverOpen, setIsGuestPopoverOpen] = useState(false);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const guestPopoverRef = useRef<HTMLDivElement>(null);

    // Fetch Data
    useEffect(() => {
        async function fetchData() {
            setIsLoadingData(true);
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

    // Close popover
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (guestPopoverRef.current && !guestPopoverRef.current.contains(event.target as Node)) {
                setIsGuestPopoverOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Logic: Availability & Pricing
    const isDateBlocked = (date: Date) => {
        if (isBefore(date, addDays(new Date(), -1))) return true;
        return existingBookings.some(b =>
            isWithinInterval(date, { start: parseISO(b.check_in), end: addDays(parseISO(b.check_out), -1) })
        );
    };

    const calculation = useMemo(() => {
        if (!dateRange?.from || !dateRange?.to || !unitRules) return null;

        const checkIn = dateRange.from;
        const checkOut = dateRange.to;
        const nightsCount = differenceInDays(checkOut, checkIn);

        if (nightsCount < 1) return null;

        const nights = eachDayOfInterval({ start: checkIn, end: addDays(checkOut, -1) });
        const isRangeBlocked = nights.some(date => isDateBlocked(date));

        if (isRangeBlocked) return { error: 'dates_blocked' };

        // Min Nights Check
        const season = seasonalPrices.find(s =>
            isWithinInterval(checkIn, { start: parseISO(s.start_date), end: parseISO(s.end_date) })
        );
        const minNights = season ? season.min_nights : unitRules.default_min_nights;
        if (nightsCount < minNights) return { error: 'min_nights', minNights };

        // Pricing
        let basePriceTotal = 0;
        nights.forEach(date => {
            const dailySeason = seasonalPrices.find(s =>
                isWithinInterval(date, { start: parseISO(s.start_date), end: parseISO(s.end_date) })
            );

            if (dailySeason) {
                basePriceTotal += dailySeason.price_per_night;
            } else {
                if (isThursday(date) || isFriday(date) || isSaturday(date)) {
                    basePriceTotal += unitRules.base_price_weekend;
                } else {
                    basePriceTotal += unitRules.base_price_weekday;
                }
            }
        });

        const petFee = guestCounts.pets * 50;
        const total = basePriceTotal + petFee;
        const avgNightly = Math.round(basePriceTotal / nightsCount);

        return { total, nights: nightsCount, avgNightly, petFee, basePriceTotal };

    }, [dateRange, unitRules, seasonalPrices, existingBookings, guestCounts.pets]);

    // Handlers
    const handleCheckAvailability = async () => {
        console.log('Checking availability for:', dateRange);
        setError(null);
        setIsCalculating(true);

        try {
            // 1. Validate Dates
            if (!dateRange?.from || !dateRange?.to) {
                throw new Error('נא לבחור תאריכי צ\'ק-אין וצ\'ק-אאוט');
            }

            if (isBefore(dateRange.to, dateRange.from)) {
                throw new Error('תאריך הצ\'ק-אאוט חייב להיות אחרי תאריך הצ\'ק-אין');
            }

            // 2. Validate availability/rules from calculation
            // We simulate a short delay to show the user something is happening (UX)
            await new Promise(resolve => setTimeout(resolve, 600));

            if (!calculation) {
                throw new Error('שגיאה בחישוב המחיר. נא לנסות שוב.');
            }

            if (calculation.error === 'dates_blocked') {
                throw new Error('חלק מהתאריכים שבחרתם תפוסים. נא לבחור תאריכים אחרים.');
            }

            if (calculation.error === 'min_nights') {
                throw new Error(`מינימום ${calculation.minNights} לילות להזמנה בתאריכים אלו.`);
            }

            // 3. Success -> Next Step
            setStep('summary');

        } catch (err: any) {
            console.error('Check Availability Error:', err);
            setError(err.message || 'אירעה שגיאה בבדיקת הזמינות');
        } finally {
            setIsCalculating(false);
        }
    };

    const handleBookingSubmit = async () => {
        if (!guestName || !guestPhone || !calculation || !dateRange?.from || !dateRange?.to) return;

        setIsSubmitting(true);
        const { error } = await supabase.from('bookings').insert([{
            guest_name: guestName,
            guest_phone: guestPhone,
            check_in: format(dateRange.from, 'yyyy-MM-dd'),
            check_out: format(dateRange.to, 'yyyy-MM-dd'),
            unit_type: unitType,
            adults: guestCounts.adults,
            children: guestCounts.children,
            infants: guestCounts.infants,
            pets: guestCounts.pets,
            total_price: calculation.total,
            status: 'pending',
            source: 'website'
        }]);

        if (error) {
            console.error(error);
            alert('שגיאה בשליחת ההזמנה');
        } else {
            alert('הזמנה נשלחה בהצלחה!');
            // In a real app, redirect to success page
            window.location.reload();
        }
        setIsSubmitting(false);
    };

    // UI Helpers
    const guestLabel = `${guestCounts.adults + guestCounts.children} אורחים${guestCounts.pets > 0 ? `, ${guestCounts.pets} חיות` : ''}`;
    const brandColor = unitType === 'villa' ? 'blue' : 'green';
    const gradientClass = unitType === 'villa' ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800' : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800';

    return (
        <Card className="w-full border-gray-100 shadow-xl bg-white rounded-2xl overflow-visible relative z-10 font-sans" dir="rtl">
            <CardContent className="p-6">

                {/* 1. Header Logic */}
                {step === 'search' && (
                    <div className="flex items-end justify-between mb-5">
                        <div className="flex flex-col">
                            {!preselectedUnitType ? (
                                <div className="flex gap-2 mb-2 bg-gray-100 p-1 rounded-lg w-fit">
                                    <button onClick={() => setUnitType('villa')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${unitType === 'villa' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500'}`}>וילה</button>
                                    <button onClick={() => setUnitType('zimmer')} className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${unitType === 'zimmer' ? 'bg-white shadow-sm text-green-700' : 'text-gray-500'}`}>צימר</button>
                                </div>
                            ) : null}
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-bold text-gray-900">
                                    ₪{calculation?.avgNightly ? calculation.avgNightly.toLocaleString() : (unitType === 'villa' ? '2,500' : '1,200')}
                                </span>
                                <span className="text-gray-500 text-sm">/ לילה</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- STEP 1: SEARCH --- */}
                {step === 'search' && (
                    <div className="animate-in fade-in slide-in-from-right duration-300">
                        {/* Input Grid */}
                        <div className="border border-gray-200 rounded-xl mb-4 relative">
                            {/* Dates */}
                            <div className="flex border-b border-gray-200">
                                <div className="flex-1 p-3 border-l border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
                                    <label className="block text-[10px] font-bold text-gray-800 uppercase tracking-wider">צ'ק-אין</label>
                                    <div className={`text-sm font-medium ${dateRange?.from ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {dateRange?.from ? format(dateRange.from, 'dd/MM/yyyy') : 'תאריך'}
                                    </div>
                                </div>
                                <div className="flex-1 p-3 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setIsCalendarOpen(!isCalendarOpen)}>
                                    <label className="block text-[10px] font-bold text-gray-800 uppercase tracking-wider">צ'ק-אאוט</label>
                                    <div className={`text-sm font-medium ${dateRange?.to ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {dateRange?.to ? format(dateRange.to, 'dd/MM/yyyy') : 'תאריך'}
                                    </div>
                                </div>
                            </div>

                            {/* Guests */}
                            <div className="p-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-b-xl" onClick={() => setIsGuestPopoverOpen(!isGuestPopoverOpen)}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-800 uppercase tracking-wider">אורחים</label>
                                        <div className="text-sm font-medium text-gray-900">{guestLabel}</div>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isGuestPopoverOpen ? 'rotate-180' : ''}`} />
                                </div>
                            </div>

                            {/* POPOVERS */}
                            {isCalendarOpen && (
                                <div className="absolute top-[calc(100%+8px)] right-0 left-0 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-4 animate-in fade-in zoom-in-95">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold">בחר תאריכים</span>
                                        <button onClick={() => setIsCalendarOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X className="h-4 w-4" /></button>
                                    </div>
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={1}
                                        disabled={isDateBlocked}
                                        className="w-full"
                                        classNames={{
                                            day_selected: "bg-black text-white hover:bg-black focus:bg-black",
                                            day_today: "bg-gray-100 text-gray-900 font-bold",
                                        }}
                                    />
                                    <Button size="sm" className="w-full mt-2" onClick={() => setIsCalendarOpen(false)}>סגור</Button>
                                </div>
                            )}

                            {isGuestPopoverOpen && (
                                <div ref={guestPopoverRef} className="absolute top-[calc(100%+8px)] right-0 left-0 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 p-5 animate-in fade-in zoom-in-95 leading-none">
                                    <Counter label="מבוגרים" subLabel="גיל 13+" value={guestCounts.adults} onChange={(v) => setGuestCounts({ ...guestCounts, adults: v })} min={1} max={unitType === 'villa' ? 15 : 4} />
                                    <Counter label="ילדים" subLabel="2-12" value={guestCounts.children} onChange={(v) => setGuestCounts({ ...guestCounts, children: v })} />
                                    <Counter label="תינוקות" subLabel="0-2" value={guestCounts.infants} onChange={(v) => setGuestCounts({ ...guestCounts, infants: v })} />
                                    <Counter label="חיות מחמד" subLabel="₪50 תוספת" value={guestCounts.pets} onChange={(v) => setGuestCounts({ ...guestCounts, pets: v })} />
                                </div>
                            )}
                        </div>

                        {/* Explicit Error Message */}
                        {error && (
                            <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-in slide-in-from-top-1 border border-red-100">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {/* Button */}
                        <Button
                            className={`w-full h-12 text-lg font-bold shadow-lg transition-all rounded-xl ${gradientClass} text-white`}
                            onClick={handleCheckAvailability}
                            disabled={isLoadingData || isCalculating}
                        >
                            {isLoadingData || isCalculating ? (
                                <div className="flex items-center gap-2 justify-center">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>בודק זמינות...</span>
                                </div>
                            ) : (
                                'בדוק זמינות'
                            )}
                        </Button>

                        {/* Calculation Warnings (Non-blocking visual cues) */}
                        {calculation?.error === 'dates_blocked' && !error && (
                            <div className="mt-3 text-red-500 text-xs text-center">
                                * תאריכים תפוסים
                            </div>
                        )}
                    </div>
                )}

                {/* --- STEP 2: SUMMARY (RECEIPT) --- */}
                {step === 'summary' && calculation && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-900">פירוט מחיר</h3>
                            <button onClick={() => setStep('search')} className="text-sm text-gray-500 hover:text-gray-900 underline flex items-center gap-1">
                                <Edit2 className="h-3 w-3" /> ערוך
                            </button>
                        </div>

                        <div className="bg-gray-50 rounded-xl p-5 mb-5 border border-gray-100">
                            <div className="space-y-3 text-sm text-gray-600">
                                <div className="flex justify-between">
                                    <span className="underline decoration-dotted decoration-gray-300">₪{calculation.avgNightly.toLocaleString()} x {calculation.nights} לילות</span>
                                    <span className="font-medium text-gray-900">₪{calculation.basePriceTotal.toLocaleString()}</span>
                                </div>
                                {calculation.petFee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="underline decoration-dotted decoration-gray-300">דמי ניקיון חיות מחמד</span>
                                        <span className="font-medium text-gray-900">₪{calculation.petFee.toLocaleString()}</span>
                                    </div>
                                )}
                            </div>

                            <div className="my-4 border-t border-gray-200 border-dashed"></div>

                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-900 text-lg">סה"כ לתשלום</span>
                                <span className={`font-black text-2xl text-${brandColor}-600`}>₪{calculation.total.toLocaleString()}</span>
                            </div>
                        </div>

                        <Button
                            className={`w-full h-12 text-lg font-bold shadow-lg rounded-xl ${gradientClass} text-white mb-3`}
                            onClick={() => setStep('form')}
                        >
                            המשך להזמנה
                        </Button>
                        <p className="text-center text-xs text-gray-400">לא תחויבו בשלב זה</p>
                    </div>
                )}

                {/* --- STEP 3: FORM --- */}
                {step === 'form' && calculation && (
                    <div className="animate-in fade-in slide-in-from-right duration-300">
                        <div className="flex items-center mb-6">
                            <button onClick={() => setStep('summary')} className="p-1 -mr-2 hover:bg-gray-100 rounded-full transition-colors">
                                <ArrowRight className="h-5 w-5 text-gray-500" />
                            </button>
                            <h3 className="text-xl font-bold text-gray-900 mr-2">פרטי המזמין</h3>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-400" /> שם מלא
                                </label>
                                <Input
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    className="bg-gray-50 border-gray-200 h-11 focus:bg-white transition-all"
                                    placeholder="ישראל ישראלי"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-gray-400" /> טלפון נייד
                                </label>
                                <Input
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                    className="bg-gray-50 border-gray-200 h-11 focus:bg-white transition-all"
                                    placeholder="050-0000000"
                                    type="tel"
                                />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3 mb-6">
                            <CheckCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800">
                                <span className="font-bold block mb-1">כמעט סיימנו!</span>
                                שליחת הבקשה תשריין את התאריכים באופן זמני עד לאישור סופי של המארח.
                            </div>
                        </div>

                        <Button
                            className={`w-full h-12 text-lg font-bold shadow-lg rounded-xl ${gradientClass} text-white`}
                            onClick={handleBookingSubmit}
                            disabled={isSubmitting || !guestName || !guestPhone}
                            isLoading={isSubmitting}
                        >
                            שלח בקשת הזמנה
                        </Button>
                    </div>
                )}

            </CardContent>
        </Card>
    );
}
