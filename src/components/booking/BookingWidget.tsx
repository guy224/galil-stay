import React, { useState, useRef, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays, isBefore, isAfter, isWithinInterval, parseISO } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, Search, Users, Minus, Plus, ChevronDown, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Calendar } from '../ui/Calendar';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { getPricingRules, calculatePrice, getMinNights } from '../../utils/bookingUtils';
import type { Unit, SeasonalPrice } from '../../types/supabase';

// Helper for Hebrew dates
const formatDateHebrew = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
    }).format(date);
};

export function BookingWidget() {
    // Stage: 'search' | 'details' | 'confirmation'
    const [stage, setStage] = useState<'search' | 'details' | 'confirmation'>('search');

    // Search State
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [unitType, setUnitType] = useState<'villa' | 'zimmer'>('villa'); // Default to Villa
    const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'loading' | 'available' | 'unavailable' | 'min_nights'>('idle');
    const [priceQuote, setPriceQuote] = useState<number | null>(null);
    const [minNightsError, setMinNightsError] = useState<number | null>(null);

    // Guest Details State
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [bookingId, setBookingId] = useState<string | null>(null);

    // Pricing Rules State
    const [unitRules, setUnitRules] = useState<Unit | null>(null);
    const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);

    // Fetch pricing rules on mount or unit change
    useEffect(() => {
        async function fetchRules() {
            const { unit, seasonalPrices: seasons } = await getPricingRules(unitType === 'villa' ? 'villa' : 'zimmer');
            setUnitRules(unit);
            setSeasonalPrices(seasons);
        }
        fetchRules();
    }, [unitType]);

    // Check Availability Logic
    const checkAvailability = async () => {
        if (!dateRange?.from || !dateRange?.to) return;

        setAvailabilityStatus('loading');
        setPriceQuote(null);
        setMinNightsError(null);

        const checkIn = dateRange.from;
        const checkOut = dateRange.to;
        const nights = differenceInDays(checkOut, checkIn);

        // 1. Min Nights Validation
        const requiredMinNights = getMinNights(checkIn, unitRules, seasonalPrices);
        if (nights < requiredMinNights) {
            setAvailabilityStatus('min_nights');
            setMinNightsError(requiredMinNights);
            return;
        }

        // 2. Database Check
        // We need to check if ANY day in the range is already booked for this unit
        // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        const { data: conflicts, error } = await supabase
            .from('bookings')
            .select('id')
            .eq('unit_type', unitType)
            .neq('status', 'declined') // Ignore declined bookings
            .lt('check_in', format(checkOut, 'yyyy-MM-dd'))
            .gt('check_out', format(checkIn, 'yyyy-MM-dd'));

        if (error) {
            console.error('Availability check failed:', error);
            setAvailabilityStatus('unavailable'); // Fail safe
            return;
        }

        if (conflicts && conflicts.length > 0) {
            setAvailabilityStatus('unavailable');
        } else {
            // 3. Calculate Price
            if (unitRules) {
                const total = calculatePrice(checkIn, checkOut, unitRules, seasonalPrices);
                setPriceQuote(total);
                setAvailabilityStatus('available');
            } else {
                // Fallback if rules not loaded?
                setAvailabilityStatus('available');
                setPriceQuote(0); // Should not happen
            }
        }
    };

    const handleSearch = () => {
        checkAvailability();
    };

    const handleBookingSubmit = async () => {
        if (!guestName || !guestPhone || !dateRange?.from || !dateRange?.to || !priceQuote) return;

        try {
            const { data, error } = await supabase
                .from('bookings')
                .insert([
                    {
                        guest_name: guestName,
                        guest_phone: guestPhone,
                        check_in: format(dateRange.from, 'yyyy-MM-dd'),
                        check_out: format(dateRange.to, 'yyyy-MM-dd'),
                        unit_type: unitType,
                        adults,
                        children,
                        total_price: priceQuote,
                        status: 'pending',
                        source: 'website'
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setBookingId(data.id);
            setStage('confirmation');
        } catch (err) {
            console.error('Booking failed:', err);
            alert('שגיאה ביצירת ההזמנה. אנא נסה שוב.');
        }
    };

    // Render Logic
    if (stage === 'confirmation') {
        return (
            <Card className="w-full max-w-md mx-auto border-none shadow-lg bg-white/90 backdrop-blur-sm">
                <CardContent className="pt-10 pb-10 flex flex-col items-center text-center space-y-4">
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                        <CheckCircle className="h-10 w-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">ההזמנה התקבלה!</h2>
                    <p className="text-gray-600 max-w-xs">
                        תודה {guestName}, קיבלנו את בקשת ההזמנה שלך.
                        <br />
                        ניצור איתך קשר בהקדם בטלפון {guestPhone} לאישור סופי.
                    </p>
                    <Button
                        className="mt-6 w-full"
                        onClick={() => window.location.reload()}
                    >
                        חזרה לדף הבית
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto border-none shadow-xl bg-white/95 backdrop-blur-md overflow-hidden ring-1 ring-black/5">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
                <CardTitle className="flex justify-between items-center text-xl">
                    <span>בדיקת זמינות והזמנה</span>
                    {stage === 'details' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:bg-white/20 p-1 h-auto"
                            onClick={() => setStage('search')}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                {stage === 'search' ? (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        {/* Unit Selector */}
                        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-lg">
                            <button
                                className={`py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${unitType === 'villa' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                onClick={() => { setUnitType('villa'); setAvailabilityStatus('idle'); }}
                            >
                                וילה
                            </button>
                            <button
                                className={`py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${unitType === 'zimmer' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                                onClick={() => { setUnitType('zimmer'); setAvailabilityStatus('idle'); }}
                            >
                                צימר
                            </button>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">תאריכים</label>
                            <div className="border rounded-xl p-3 bg-white hover:border-blue-300 transition-colors">
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={(range) => {
                                        setDateRange(range);
                                        setAvailabilityStatus('idle');
                                    }}
                                    numberOfMonths={1}
                                    className="rounded-md border-none w-full"
                                    classNames={{
                                        head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem]",
                                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-r-md last:[&:has([aria-selected])]:rounded-l-md focus-within:relative focus-within:z-20",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Guests */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">מבוגרים</label>
                                <div className="flex items-center justify-between border rounded-lg p-2 bg-gray-50">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setAdults(Math.max(1, adults - 1))}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="font-medium text-lg w-6 text-center">{adults}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setAdults(Math.min(10, adults + 1))}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">ילדים</label>
                                <div className="flex items-center justify-between border rounded-lg p-2 bg-gray-50">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setChildren(Math.max(0, children - 1))}
                                    >
                                        <Minus className="h-4 w-4" />
                                    </Button>
                                    <span className="font-medium text-lg w-6 text-center">{children}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={() => setChildren(Math.min(10, children + 1))}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Status / Check Button */}
                        <div className="pt-2">
                            {availabilityStatus === 'idle' && (
                                <Button
                                    className="w-full h-12 text-lg font-medium shadow-lg shadow-blue-200"
                                    onClick={handleSearch}
                                    disabled={!dateRange?.from || !dateRange?.to}
                                >
                                    <Search className="ml-2 h-5 w-5" />
                                    בדוק זמינות ומחיר
                                </Button>
                            )}

                            {availabilityStatus === 'loading' && (
                                <div className="flex justify-center py-2 text-blue-600">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            )}

                            {availabilityStatus === 'available' && priceQuote !== null && (
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 bg-green-50 border border-green-200 rounded-xl p-4 text-center space-y-3">
                                    <div className="flex items-center justify-center gap-2 text-green-800 font-medium">
                                        <CheckCircle className="h-5 w-5" />
                                        פנוי להזמנה!
                                    </div>
                                    <div className="text-3xl font-bold text-gray-900">
                                        ₪{priceQuote.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        עבור {differenceInDays(dateRange!.to!, dateRange!.from!)} לילות
                                    </div>
                                    <Button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200"
                                        onClick={() => setStage('details')}
                                    >
                                        המשך להזמנה
                                    </Button>
                                </div>
                            )}

                            {availabilityStatus === 'unavailable' && (
                                <div className="animate-in shake bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-700">
                                    <div className="flex items-center justify-center gap-2 font-medium mb-1">
                                        <XCircle className="h-5 w-5" />
                                        לא פנוי
                                    </div>
                                    <p className="text-sm opacity-90">נסו לשנות תאריכים או לבדוק ביחידה השניה</p>
                                </div>
                            )}

                            {availabilityStatus === 'min_nights' && (
                                <div className="animate-in shake bg-orange-50 border border-orange-200 rounded-xl p-4 text-center text-orange-800">
                                    <div className="flex items-center justify-center gap-2 font-medium mb-1">
                                        <AlertCircle className="h-5 w-5" />
                                        מינימום הזמנה
                                    </div>
                                    <p className="text-sm opacity-90">
                                        בתאריכים אלו נדרש מינימום של {minNightsError} לילות.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Details Stage
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
                            <div className="flex justify-between">
                                <span>יחידה:</span>
                                <span className="font-medium">{unitType === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>תאריכים:</span>
                                <span className="font-medium">
                                    {format(dateRange!.from!, 'dd/MM')} - {format(dateRange!.to!, 'dd/MM')}
                                </span>
                            </div>
                            <div className="flex justify-between border-t pt-2 mt-2">
                                <span className="font-bold text-lg">סה"כ לתשלום:</span>
                                <span className="font-bold text-lg">₪{priceQuote?.toLocaleString()}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">שם מלא</label>
                                <Input
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="ישראל ישראלי"
                                    className="bg-white"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">טלפון נייד</label>
                                <Input
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                    placeholder="050-0000000"
                                    className="bg-white"
                                    type="tel"
                                />
                            </div>
                        </div>

                        <Button
                            className="w-full h-12"
                            onClick={handleBookingSubmit}
                            disabled={!guestName || !guestPhone}
                        >
                            שלח בקשה ({priceQuote?.toLocaleString()} ₪)
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                            * התשלום יתבצע לאחר אישור ההזמנה
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
