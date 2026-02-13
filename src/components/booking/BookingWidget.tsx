import React, { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays, isBefore, isAfter, isWithinInterval, parseISO } from 'date-fns';
import { ArrowLeft, CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Calendar } from '../ui/Calendar';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { supabase } from '../../lib/supabase';

interface BookingWidgetProps {
    unitType: 'villa' | 'zimmer';
    basePrice: number;
}

export function BookingWidget({ unitType, basePrice }: BookingWidgetProps) {
    // State
    const [step, setStep] = useState<'search' | 'results'>('search');
    const [date, setDate] = useState<DateRange | undefined>();
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');

    // Availability State
    const [isChecking, setIsChecking] = useState(false);
    const [availability, setAvailability] = useState<'idle' | 'available' | 'taken'>('idle');
    const [suggestedDate, setSuggestedDate] = useState<DateRange | undefined>();

    // Booking Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Derived
    const totalNights = date?.from && date?.to ? differenceInDays(date.to, date.from) : 0;
    const totalPrice = totalNights * basePrice;

    // --- Logic: Check Availability ---
    const checkAvailability = async () => {
        if (!date?.from || !date?.to) {
            setError('נא לבחור תאריכי הגעה ועזיבה');
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
                findNextAvailableSlot(bookings || [], totalNights);
                setStep('results');
            }

        } catch (err) {
            console.error(err);
            setError('אירעה שגיאה בבדיקת הזמינות');
        } finally {
            setIsChecking(false);
        }
    };

    // --- Logic: Find Next Slot ---
    const findNextAvailableSlot = (bookings: { check_in: string; check_out: string }[], duration: number) => {
        // Simple algorithm: Start from today, look for gaps between bookings
        let searchDate = new Date();
        const maxSearchDate = addDays(new Date(), 60); // Look 2 months ahead

        // Sort just in case
        const sortedBookings = [...bookings].sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());

        while (searchDate < maxSearchDate) {
            const potentialEnd = addDays(searchDate, duration);

            // Check if this slot overlaps with any booking
            const isOverlap = sortedBookings.some(b => {
                const bStart = parseISO(b.check_in);
                const bEnd = parseISO(b.check_out);
                return (
                    (searchDate < bEnd && potentialEnd > bStart)
                );
            });

            if (!isOverlap) {
                setSuggestedDate({ from: searchDate, to: potentialEnd });
                return;
            }

            // Move search to the end of the clashing booking + 1 day? 
            // Optimization: Find the booking that overlaps and jump to its end
            const clashingBooking = sortedBookings.find(b => {
                const bStart = parseISO(b.check_in);
                const bEnd = parseISO(b.check_out);
                return (searchDate < bEnd && potentialEnd > bStart);
            });

            if (clashingBooking) {
                searchDate = parseISO(clashingBooking.check_out);
            } else {
                searchDate = addDays(searchDate, 1);
            }
        }
        setSuggestedDate(undefined); // No slot found
    };

    // --- Logic: Submit Booking ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date?.from || !date?.to || !guestName || !guestPhone) return;

        setIsSubmitting(true);

        const { error: insertError } = await supabase
            .from('bookings')
            .insert({
                unit_type: unitType,
                check_in: format(date.from, 'yyyy-MM-dd'),
                check_out: format(date.to, 'yyyy-MM-dd'),
                guest_name: guestName,
                guest_phone: guestPhone,
                total_price: totalPrice,
                status: 'pending'
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
                            תודה {guestName}, שריינו עבורך את התאריכים.
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

    // --- Render: Main Widget ---
    return (
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur shadow-xl border-primary/20 overflow-hidden transition-all duration-300">
            <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="text-center text-primary flex items-center justify-center gap-2">
                    {step === 'results' && availability === 'available' ? 'השלמת הזמנה' : 'בדיקת זמינות'}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-6">

                {/* Step 1: Search */}
                {step === 'search' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
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
                            disabled={!date?.from || !date?.to}
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
                                <p className="text-xs text-green-700">
                                    {totalNights} לילות • {totalPrice} ₪ סה"כ
                                </p>
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
                                    שלח בקשה
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

                        {suggestedDate?.from && suggestedDate?.to ? (
                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-right">
                                <p className="text-sm text-blue-800 font-medium mb-2">מצאנו תאריכים פנויים קרובים:</p>
                                <div className="flex items-center justify-between bg-white p-3 rounded border border-blue-200 shadow-sm">
                                    <span className="font-bold text-gray-800">
                                        {format(suggestedDate.from, 'dd/MM')} - {format(suggestedDate.to, 'dd/MM')}
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-primary hover:text-primary/80 hover:bg-primary/10 -ml-2"
                                        onClick={() => {
                                            setDate(suggestedDate);
                                            setAvailability('available');
                                            // Optional: immediately verify again or just trust logic
                                        }}
                                    >
                                        בחר
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500">לא נמצאו תאריכים פנויים בטווח הקרוב.</p>
                        )}

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

            </CardContent>
        </Card>
    );
}
