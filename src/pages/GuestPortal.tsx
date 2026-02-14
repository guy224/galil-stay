import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Booking } from '../types/supabase';
import { Loader2, AlertCircle } from 'lucide-react';
import GuestLandingPage from '../components/guest/GuestLandingPage';

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

    // --- NEW: Unified Guest Page ---
    return <GuestLandingPage booking={booking} />;
}
