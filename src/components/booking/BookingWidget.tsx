import React, { useState, useEffect } from 'react';
import type { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays, isBefore, isAfter, isWithinInterval, parseISO } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, Search, Loader2, AlertCircle, Calendar as CalendarIcon, Phone, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Calendar } from '../ui/Calendar';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { supabase } from '../../lib/supabase';
import { getPricingRules, calculatePrice, getMinNights } from '../../utils/bookingUtils';
import type { Unit, SeasonalPrice } from '../../types/supabase';
import { GuestSelector } from './GuestSelector';

interface BookingWidgetProps {
    preselectedUnitType?: 'villa' | 'zimmer';
}

export function BookingWidget({ preselectedUnitType }: BookingWidgetProps) {
    // Stage: 'search' | 'details' | 'confirmation'
    const [stage, setStage] = useState<'search' | 'details' | 'confirmation'>('search');

    // Search State
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [guestCounts, setGuestCounts] = useState({
        adults: 2,
        children: 0,
        infants: 0,
        pets: 0
    });

    // Unit Type Logic
    // If preselected is passed, use it. Otherwise default to villa but allow switching.
    const [unitType, setUnitType] = useState<'villa' | 'zimmer'>(preselectedUnitType || 'villa');

    // Availability & Pricing State
    const [availabilityStatus, setAvailabilityStatus] = useState<'idle' | 'loading' | 'available' | 'unavailable' | 'min_nights'>('idle');
    const [priceQuote, setPriceQuote] = useState<number | null>(null);
    const [minNightsError, setMinNightsError] = useState<number | null>(null);
    const [blockedDates, setBlockedDates] = useState<Date[]>([]); // Optional: for calendar to show unavailable days

    // Guest Contact Details
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pricing Rules State
    const [unitRules, setUnitRules] = useState<Unit | null>(null);
    const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);

    // Reset unit type if prop changes (though usually it won't change on the fly)
    useEffect(() => {
        if (preselectedUnitType) {
            setUnitType(preselectedUnitType);
        }
    }, [preselectedUnitType]);

    // Fetch Pricing Rules
    useEffect(() => {
        async function fetchRules() {
            setAvailabilityStatus('loading');
            const data = await getPricingRules(unitType);
            if (data) {
                setUnitRules(data.unit);
                setSeasonalPrices(data.seasonal);
            }
            setAvailabilityStatus('idle');
        }
        fetchRules();
    }, [unitType]);

    // Availability Check Logic -- THE CORE FIX
    const checkAvailability = async () => {
        if (!dateRange?.from || !dateRange?.to) return;

        // Reset state
        setAvailabilityStatus('loading');
        setPriceQuote(null);
        setMinNightsError(null);

        try {
            const checkIn = dateRange.from;
            const checkOut = dateRange.to;
            const nights = differenceInDays(checkOut, checkIn);

            if (nights < 1) {
                setAvailabilityStatus('idle'); // Invalid range
                return;
            }

            // 1. Min Nights Check
            // We need unitRules to be loaded
            if (unitRules) {
                const requiredMin = getMinNights(checkIn, unitRules, seasonalPrices);
                if (nights < requiredMin) {
                    setAvailabilityStatus('min_nights');
                    setMinNightsError(requiredMin);
                    return;
                }
            }

            // 2. Supabase Overlap Check
            // Find any booking that overlaps with [CheckIn, CheckOut)
            // Query: start_date < checkOut AND end_date > checkIn
            const { data: conflicts, error } = await supabase
                .from('bookings')
                .select('id')
                .eq('unit_type', unitType)
                .neq('status', 'declined') // Ignore declined
                .lt('check_in', format(checkOut, 'yyyy-MM-dd'))
                .gt('check_out', format(checkIn, 'yyyy-MM-dd'));

            if (error) throw error;

            if (conflicts && conflicts.length > 0) {
                setAvailabilityStatus('unavailable');
            } else {
                // 3. Calculate Price
                if (unitRules) {
                    // Note: calculatePrice expects SeasonalPrice[]
                    const { totalPrice } = calculatePrice(checkIn, checkOut, unitRules, seasonalPrices);
                    setPriceQuote(totalPrice);
                    setAvailabilityStatus('available');
                }
            }

        } catch (err) {
            console.error('Availability check failed:', err);
            // Fallback to allow user to try again? Or show error?
            setAvailabilityStatus('idle');
        }
    };

    const handleBookingSubmit = async () => {
        if (!guestName || !guestPhone || !dateRange?.from || !dateRange?.to || !priceQuote) return;

        setIsSubmitting(true);
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
                        adults: guestCounts.adults,
                        children: guestCounts.children,
                        infants: guestCounts.infants || 0, // Add to DB if column exists, otherwise it's just in metadata
                        pets: guestCounts.pets || 0,
                        total_price: priceQuote,
                        status: 'pending',
                        source: 'website'
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            setStage('confirmation');
        } catch (err) {
            console.error('Booking failed:', err);
            alert('שגיאה ביצירת ההזמנה. אנא נסה שוב.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Render Confirmation Step
    if (stage === 'confirmation') {
        return (
            <Card className="w-full h-fit border-none shadow-xl bg-white/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
                <CardContent className="pt-12 pb-12 flex flex-col items-center text-center space-y-6">
                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mb-2 shadow-inner">
                        <CheckCircle className="h-12 w-12 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">ההזמנה התקבלה!</h2>
                        <p className="text-gray-500 text-lg">מספר הזמנה: #{Math.floor(Math.random() * 10000)}</p>
                    </div>
                    <div className="bg-gray-50 p-6 rounded-2xl w-full max-w-sm border border-gray-100">
                        <p className="text-gray-700 leading-relaxed">
                            תודה <strong>{guestName}</strong>,<br />
                            קיבלנו את בקשת ההזמנה שלך.<br />
                            ניצור איתך קשר בהקדם בטלפון <strong>{guestPhone}</strong> לאישור סופי.
                        </p>
                    </div>
                    <Button
                        className="w-full max-w-sm h-12 text-lg"
                        onClick={() => window.location.reload()}
                    >
                        חזרה לדף הבית
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full border-none shadow-xl bg-white/95 backdrop-blur-md overflow-hidden ring-1 ring-black/5 rounded-2xl">
            {/* Header */}
            <div className={`p-6 text-white bg-gradient-to-r ${unitType === 'villa' ? 'from-blue-600 to-blue-700' : 'from-green-600 to-green-700'}`}>
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {stage === 'search' ? (
                            <>
                                <CalendarIcon className="h-5 w-5 opacity-80" />
                                בדיקת זמינות
                            </>
                        ) : (
                            <>
                                <span onClick={() => setStage('search')} className="cursor-pointer hover:underline flex items-center gap-1 opacity-90 transition-opacity hover:opacity-100">
                                    <ArrowLeft className="h-4 w-4" />
                                    חזרה
                                </span>
                            </>
                        )}
                    </h2>
                    {/* Only show price preview in header if available */}
                    {stage === 'details' && priceQuote && (
                        <div className="text-lg font-bold">₪{priceQuote.toLocaleString()}</div>
                    )}
                </div>
            </div>

            <CardContent className="p-6 space-y-6">

                {stage === 'search' ? (
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">

                        {/* 1. Unit Selection (Only if NOT preselected) */}
                        {!preselectedUnitType && (
                            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                                <button
                                    className={`py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${unitType === 'villa' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'}`}
                                    onClick={() => { setUnitType('villa'); setAvailabilityStatus('idle'); }}
                                >
                                    וילה בגליל
                                </button>
                                <button
                                    className={`py-3 px-4 rounded-lg text-sm font-bold transition-all duration-200 ${unitType === 'zimmer' ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-900'}`}
                                    onClick={() => { setUnitType('zimmer'); setAvailabilityStatus('idle'); }}
                                >
                                    צימר בין הנחלים
                                </button>
                            </div>
                        )}

                        {/* 2. Calendar */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 block">תאריכי חופשה</label>
                            <div className="border border-gray-200 rounded-xl p-3 bg-white hover:border-blue-400 transition-colors focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400">
                                <Calendar
                                    mode="range"
                                    selected={dateRange}
                                    onSelect={(range) => {
                                        setDateRange(range);
                                        setAvailabilityStatus('idle');
                                    }}
                                    numberOfMonths={1}
                                    className="w-full"
                                    classNames={{
                                        head_cell: "text-muted-foreground w-9 font-normal text-[0.8rem]",
                                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-r-md last:[&:has([aria-selected])]:rounded-l-md focus-within:relative focus-within:z-20",
                                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-gray-100 rounded-md transition-colors"
                                    }}
                                    disabled={(date) => isBefore(date, addDays(new Date(), -1))}
                                />
                            </div>
                        </div>

                        {/* 3. Guest Selector (Airbnb Style) */}
                        <GuestSelector
                            counts={guestCounts}
                            onChange={setGuestCounts}
                            maxGuests={unitType === 'villa' ? 15 : 4}
                        />

                        {/* 4. Action Button / Status */}
                        <div className="pt-2">
                            {availabilityStatus === 'idle' && (
                                <Button
                                    className={`w-full h-12 text-lg font-bold shadow-lg transition-all ${unitType === 'villa' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-green-600 hover:bg-green-700 shadow-green-200'}`}
                                    onClick={checkAvailability}
                                    disabled={!dateRange?.from || !dateRange?.to}
                                >
                                    {(!dateRange?.from || !dateRange?.to) ? 'בחר תאריכים' : 'בדוק זמינות ומחיר'}
                                </Button>
                            )}

                            {availabilityStatus === 'loading' && (
                                <div className="flex items-center justify-center h-12 bg-gray-50 rounded-xl border border-gray-100 text-gray-400">
                                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                    מחשב מחיר...
                                </div>
                            )}

                            {availabilityStatus === 'available' && priceQuote !== null && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                                        <div className="flex items-center justify-center gap-2 text-green-800 font-bold mb-1">
                                            <CheckCircle className="h-5 w-5" />
                                            התאריכים פנויים!
                                        </div>
                                        <div className="text-3xl font-black text-gray-900 tracking-tight">
                                            ₪{priceQuote.toLocaleString()}
                                        </div>
                                        <div className="text-sm text-gray-500 font-medium">
                                            עבור {differenceInDays(dateRange!.to!, dateRange!.from!)} לילות
                                        </div>
                                    </div>
                                    <Button
                                        className="w-full h-12 text-lg font-bold bg-gray-900 hover:bg-black text-white shadow-lg shadow-gray-200"
                                        onClick={() => setStage('details')}
                                    >
                                        המשך להזמנה
                                    </Button>
                                </div>
                            )}

                            {availabilityStatus === 'unavailable' && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center text-red-700 animate-in shake">
                                    <div className="flex items-center justify-center gap-2 font-bold mb-1">
                                        <XCircle className="h-5 w-5" />
                                        לא פנוי
                                    </div>
                                    <p className="text-sm opacity-90">התאריכים שבחרתם תפוסים. נסו תאריכים אחרים.</p>
                                </div>
                            )}

                            {availabilityStatus === 'min_nights' && (
                                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center text-orange-800 animate-in shake">
                                    <div className="flex items-center justify-center gap-2 font-bold mb-1">
                                        <AlertCircle className="h-5 w-5" />
                                        מינימום לילות
                                    </div>
                                    <p className="text-sm opacity-90">
                                        מינימום להזמנה בתאריכים אלו: <strong>{minNightsError} לילות</strong>.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                ) : (
                    // DETAILS STAGE
                    <div className="space-y-6 animate-in slide-in-from-right duration-300">
                        {/* Summary Card */}
                        <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-3">
                            <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wide opacity-50 mb-2">פרטי החופשה</h3>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">יחידה</span>
                                <span className="font-bold text-gray-900">{unitType === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים'}</span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">תאריכים</span>
                                <span className="font-bold text-gray-900">
                                    {format(dateRange!.from!, 'dd/MM')} - {format(dateRange!.to!, 'dd/MM')}
                                </span>
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600">הרכב</span>
                                <span className="font-bold text-gray-900">
                                    {guestCounts.adults} מבוגרים, {guestCounts.children} ילדים
                                </span>
                            </div>

                            <div className="border-t border-gray-200 my-2 pt-2 flex justify-between items-center">
                                <span className="font-bold text-gray-900 text-lg">סה"כ לתשלום</span>
                                <span className="font-black text-xl text-primary">₪{priceQuote?.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    שם מלא
                                </label>
                                <Input
                                    value={guestName}
                                    onChange={(e) => setGuestName(e.target.value)}
                                    placeholder="ישראל ישראלי"
                                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    טלפון נייד
                                </label>
                                <Input
                                    value={guestPhone}
                                    onChange={(e) => setGuestPhone(e.target.value)}
                                    placeholder="050-0000000"
                                    className="bg-gray-50 border-gray-200 focus:bg-white transition-colors h-11"
                                    type="tel"
                                />
                            </div>
                        </div>

                        <Button
                            className={`w-full h-12 text-lg font-bold shadow-lg ${unitType === 'villa' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}`}
                            onClick={handleBookingSubmit}
                            disabled={!guestName || !guestPhone || isSubmitting}
                            isLoading={isSubmitting}
                        >
                            {isSubmitting ? 'שולח...' : 'שלח בקשת הזמנה'}
                        </Button>
                        <p className="text-xs text-center text-gray-400 mt-2">
                            * אישור סופי ופרטי תשלום יישלחו בהמשך
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
