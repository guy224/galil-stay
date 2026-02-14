import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { supabase } from '../lib/supabase';
import { Booking } from '../types/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import { GateCodeCard } from '../components/guest/GateCodeCard';
import { BreakfastOrder } from '../components/guest/BreakfastOrder';
import { QuickActions } from '../components/guest/QuickActions';
import ZimmerGuestPage from './guest/ZimmerGuestPage';

export default function GuestPortal() {
    const { id } = useParams<{ id: string }>();
    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBooking = async () => {
        if (!id) return;

        // Using the 'maybeSingle' or just 'single' to get the booking. 
        // Depending on RLS, this should work if policies are open (which they are for demo).
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error("Error fetching booking:", error);
            setError('לא ניתן לטעון את ההזמנה. אנא וודא שהקישור תקין.');
        } else {
            setBooking(data as Booking);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBooking();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <h2 className="text-xl font-bold mb-2">שגיאה בטעינת ההזמנה</h2>
                <p className="text-gray-600">{error || 'ההזמנה לא נמצאה'}</p>
            </div>
        );
    }

    // --- NEW: Zimmer Guest Guide Logic ---
    if (booking.unit_type === 'zimmer') {
        return <ZimmerGuestPage booking={booking} />;
    }

    // --- Original Logic (for Villa / Fallback) ---
    // Calculate days until vacation
    const today = new Date();
    const checkIn = parseISO(booking.check_in);
    const daysUntil = differenceInCalendarDays(checkIn, today);

    let welcomeMessage = "החופשה מתקרבת...";
    if (daysUntil > 0) {
        welcomeMessage = `עוד ${daysUntil} ימים לחופשה!`;
    } else if (daysUntil === 0) {
        welcomeMessage = "היום זה קורה! ברוכים הבאים.";
    } else {
        welcomeMessage = "תהנו מהחופשה!";
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header */}
            <div className="bg-primary text-white p-8 rounded-b-3xl shadow-lg text-center relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">שלום, {booking.guest_name.split(' ')[0]}</h1>
                    <p className="text-primary-foreground/90 font-medium text-lg">{welcomeMessage}</p>
                    <p className="text-sm opacity-75 mt-2">
                        {booking.unit_type === 'villa' ? 'בית גלילי' : 'צימר בין הנחלים'}
                        {' • '}
                        {booking.check_in} עד {booking.check_out}
                    </p>
                </div>
                {/* Decorative circle */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
            </div>

            <div className="container mx-auto px-4 -mt-6 space-y-6 relative z-10 max-w-md">

                {/* Gate Code Section */}
                <section>
                    <GateCodeCard booking={booking} />
                </section>

                {/* Quick Actions */}
                <section>
                    <h3 className="text-lg font-bold mb-3 px-1">פעולות מהירות</h3>
                    <QuickActions />
                </section>

                {/* Breakfast Section */}
                <section>
                    <BreakfastOrder booking={booking} onUpdate={fetchBooking} />
                </section>

            </div>
        </div>
    );
}
