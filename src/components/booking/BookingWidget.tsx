import React, { useState, useRef, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays, isBefore, isAfter, isWithinInterval, parseISO } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, Search, Users, Minus, Plus, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Calendar } from '../ui/Calendar';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { getPricingRules, calculatePrice, getMinNights } from '../../utils/bookingUtils';
import { Unit, SeasonalPrice } from '../../types/supabase';

interface BookingWidgetProps {
    unitType: 'villa' | 'zimmer';
    basePrice?: number; // Deprecated, but kept for interface compatibility if needed
}

export function BookingWidget({ unitType }: BookingWidgetProps) {
    // State
    const [step, setStep] = useState<'search' | 'results'>('search');
    const [date, setDate] = useState<DateRange | undefined>();
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    // Guest Composition State
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);
    const [pets, setPets] = useState(0);
    const [isGuestMenuOpen, setIsGuestMenuOpen] = useState(false);
    const guestMenuRef = useRef<HTMLDivElement>(null);

    // Pricing & Rules State
    const [rules, setRules] = useState<{ unit: Unit, seasonal: SeasonalPrice[] } | null>(null);
    const [priceData, setPriceData] = useState<{ totalPrice: number, breakdown: any[] } | null>(null);
    const [minNights, setMinNights] = useState(1);
    const [pricingLoading, setPricingLoading] = useState(true);

    // Availability State
    const [isChecking, setIsChecking] = useState(false);
    const [availability, setAvailability] = useState<'idle' | 'available' | 'taken'>('idle');
    const [suggestedDate, setSuggestedDate] = useState<DateRange | undefined>();

    // Booking Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Fetch Rules on Mount ---
    useEffect(() => {
        const fetchRules = async () => {
            setPricingLoading(true);
            const data = await getPricingRules(unitType);
            if (data) {
                setRules(data);
                setMinNights(data.unit.default_min_nights);
            }
            setPricingLoading(false);
        };
        fetchRules();
    }, [unitType]);

    // --- Calculate Price & Min Nights when dates change ---
    useEffect(() => {
        if (rules && date?.from && date?.to) {
            // Price
            const calculated = calculatePrice(date.from, date.to, rules.unit, rules.seasonal);
            setPriceData(calculated);

            // Min Nights
            const required = getMinNights(date.from, rules.unit, rules.seasonal);
            setMinNights(required);
        } else {
            setPriceData(null);
        }
    }, [date, rules]);

    // Helper: Close guest menu on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (guestMenuRef.current && !guestMenuRef.current.contains(event.target as Node)) {
                setIsGuestMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper: Guest Summary String
    const getGuestSummary = () => {
        const totalGuests = adults + children;
        let summary = `${totalGuests} אורחים`;
        if (infants > 0) summary += `, ${infants} תינוקות`;
        if (pets > 0) summary += `, ${pets} חיות מחמד`;
        return summary;
    };

    // --- Logic: Check Availability ---
    const checkAvailability = async () => {
        if (!date?.from || !date?.to) {
            setError('נא לבחור תאריכי הגעה ועזיבה');
            return;
        }
        if (adults < 1) {
            setError('חובה לבחור לפחות מבוגר אחד');
            return;
        }

        // Check Min Nights
        const nights = differenceInDays(date.to, date.from);
        if (nights < minNights) {
            setError(`מינימום לילות בתאריכים אלו: ${minNights}`);
            return;
        }

        setError(null);
        setIsChecking(true);

        try {
            // 1. Fetch all future bookings for this unit
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const { data: bookings, error: dbError } = await supabase
                .from('bookings')
                .select('check_in, check_out')
                .eq('unit_type', unitType)
                .neq('status', 'declined') // Ignore declined bookings
                .gte('check_out', todayStr)
                .order('check_in', { ascending: true });

            if (dbError) throw dbError;

            // 2. Check for overlaps
            const requestedStart = date.from;
            const requestedEnd = date.to;

            const hasOverlap = bookings?.some(b => {
                const existingStart = parseISO(b.check_in);
                const existingEnd = parseISO(b.check_out);

                return (
                    (isWithinInterval(requestedStart, { start: existingStart, end: existingEnd }) && requestedStart < existingEnd) ||
                    (isWithinInterval(requestedEnd, { start: existingStart, end: existingEnd }) && requestedEnd > existingStart) ||
                    (isBefore(requestedStart, existingStart) && isAfter(requestedEnd, existingEnd))
                );
            });

            if (!hasOverlap) {
                setAvailability('available');
                setStep('results');
            } else {
                setAvailability('taken');
                // findNextAvailableSlot(bookings || [], nights); // keeping the existing logic placeholder
                setStep('results');
            }

        } catch (err) {
            console.error(err);
            setError('אירעה שגיאה בבדיקת הזמינות');
        } finally {
            setIsChecking(false);
        }
    };

    // --- Logic: Submit Booking ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date?.from || !date?.to || !guestName || !guestPhone || !priceData) return;

        setIsSubmitting(true);

        const { error: insertError } = await supabase
            .from('bookings')
            .insert({
                unit_type: unitType,
                check_in: format(date.from, 'yyyy-MM-dd'),
                check_out: format(date.to, 'yyyy-MM-dd'),
                guest_name: guestName,
                guest_phone: guestPhone,
                total_price: priceData.totalPrice, // Use dynamically calculated price
                status: 'pending',
                adults,
                children,
                infants,
                pets
            });

        setIsSubmitting(false);

        if (insertError) {
            setError('שגיאה בשליחת ההזמנה');
        } else {
            setBookingSuccess(true);
        }
    };

    // --- Render: Success ---
    if (bookingSuccess) {
        return (
            <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur animate-in fade-in zoom-in-95 duration-300">
                <CardContent className="pt-8 text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900">הבקשה נשלחה!</h3>
                        <p className="text-gray-500 mt-2">
                            תודה {guestName}, קיבלנו את בקשתך עבור {getGuestSummary()}.
                            <br />
                            ניצור איתך קשר בקרוב לאישור סופי.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            setBookingSuccess(false);
                            setStep('search');
                            setDate(undefined);
                            setGuestName('');
                            setGuestPhone('');
                            setAvailability('idle');
                            setAdults(2);
                            setChildren(0);
                            setInfants(0);
                            setPets(0);
                        }}
                        variant="outline"
                        className="w-full"
                    >
                        ביצוע הזמנה נוספת
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // --- Component: Counter Row ---
    const CounterRow = ({ label, subLabel, value, onChange, min = 0 }: any) => (
        <div className="flex items-center justify-between py-3 border-b last:border-0">
            <div>
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-gray-500">{subLabel}</div>
            </div>
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={() => onChange(Math.max(min, value - 1))}
                    disabled={value <= min}
                    className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-600 disabled:opacity-30 hover:border-black transition-colors"
                >
                    <Minus className="h-3 w-3" />
                </button>
                <span className="w-4 text-center font-medium text-sm">{value}</span>
                <button
                    type="button"
                    onClick={() => onChange(value + 1)}
                    className="w-8 h-8 rounded-full border flex items-center justify-center text-gray-600 hover:border-black transition-colors"
                >
                    <Plus className="h-3 w-3" />
                </button>
            </div>
        </div>
    );

    // --- Render: Main Widget ---
    return (
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur shadow-xl border-primary/20 overflow-visible transition-all duration-300">
            <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-center text-primary flex items-center justify-center gap-2">
                    {step === 'results' && availability === 'available' ? 'השלמת הזמנה' : 'בדיקת זמינות'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6 relative">

                {pricingLoading && !rules ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                    </div>
                ) : (
                    <>
                        {/* Step 1: Search */}
                        {step === 'search' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                {/* Date Picker */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">מתי מגיעים?</label>
                                    <div className="flex justify-center border rounded-xl p-2 bg-white shadow-sm">
                                        <Calendar
                                            mode="range"
                                            selected={date}
                                            onSelect={setDate}
                                            numberOfMonths={1}
                                            disabled={(date) => date < new Date()}
                                        />
                                    </div>
                                    {minNights > 1 && (
                                        <p className="text-xs text-gray-400 text-center">
                                            * מינימום {minNights} לילות בתאריכים אלו
                                        </p>
                                    )}
                                </div>

                                {/* Guest Selector */}
                                <div className="space-y-2 relative" ref={guestMenuRef}>
                                    <label className="text-sm font-medium text-gray-700">מי מגיע?</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsGuestMenuOpen(!isGuestMenuOpen)}
                                        className="w-full flex items-center justify-between h-12 px-4 border rounded-xl bg-white shadow-sm hover:border-primary/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-2 text-gray-700">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium">{getGuestSummary()}</span>
                                        </div>
                                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isGuestMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isGuestMenuOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                                            <CounterRow
                                                label="מבוגרים"
                                                subLabel="מגיל 13 ומעלה"
                                                value={adults}
                                                onChange={setAdults}
                                                min={1}
                                            />
                                            <CounterRow
                                                label="ילדים"
                                                subLabel="גילאים 2-12"
                                                value={children}
                                                onChange={setChildren}
                                            />
                                            <CounterRow
                                                label="תינוקות"
                                                subLabel="מתחת לגיל 2"
                                                value={infants}
                                                onChange={setInfants}
                                            />
                                            <CounterRow
                                                label="חיות מחמד"
                                                subLabel="כלבים וחתולים"
                                                value={pets}
                                                onChange={setPets}
                                            />
                                            <div className="pt-2 text-left">
                                                <button
                                                    onClick={() => setIsGuestMenuOpen(false)}
                                                    className="text-sm font-bold text-primary hover:underline"
                                                >
                                                    סגור
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                                        <XCircle className="h-4 w-4" /> {error}
                                    </div>
                                )}

                                <Button
                                    onClick={checkAvailability}
                                    className="w-full h-12 text-lg"
                                    size="lg"
                                    isLoading={isChecking}
                                    disabled={!date?.from || !date?.to || adults < 1}
                                >
                                    <Search className="ml-2 h-5 w-5" />
                                    בדוק זמינות
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Results */}
                        {step === 'results' && availability === 'available' && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center gap-3">
                                    <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                                    <div>
                                        <p className="font-bold text-green-800">התאריכים פנויים!</p>
                                        {priceData && (
                                            <p className="text-xs text-green-700">
                                                {differenceInDays(date!.to!, date!.from!)} לילות •
                                                <span className="font-bold text-lg mx-1">₪{priceData.totalPrice.toLocaleString()}</span>
                                                סה"כ
                                                <br />
                                                עבור {getGuestSummary()}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">שם מלא</label>
                                        <Input
                                            value={guestName}
                                            onChange={(e) => setGuestName(e.target.value)}
                                            required
                                            className="h-11"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">טלפון</label>
                                        <Input
                                            value={guestPhone}
                                            onChange={(e) => setGuestPhone(e.target.value)}
                                            required
                                            className="h-11 text-right"
                                            placeholder="050-0000000"
                                            dir="ltr"
                                        />
                                    </div>

                                    <div className="pt-2 flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setStep('search')}
                                            className="flex-1"
                                        >
                                            חזרה
                                        </Button>
                                        <Button
                                            type="submit"
                                            className="flex-[2]"
                                            isLoading={isSubmitting}
                                        >
                                            הזמן עכשיו - ₪{priceData?.totalPrice}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Step 2: Taken */}
                        {step === 'results' && availability === 'taken' && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 text-center">
                                <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                                    <XCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
                                    <h3 className="font-bold text-red-900 text-lg">התאריכים תפוסים</h3>
                                    <p className="text-sm text-red-700 mt-1">
                                        מצטערים, יש כבר הזמנה בתאריכים האלו.
                                    </p>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setStep('search')}
                                    className="w-full"
                                >
                                    <ArrowLeft className="ml-2 h-4 w-4" />
                                    נסה תאריכים אחרים
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}
