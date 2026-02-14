import React, { useState } from 'react';
import { Coffee, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Booking } from '../../types/supabase';
import { supabase } from '../../lib/supabase';

interface BreakfastOrderProps {
    booking: Booking;
    onUpdate: () => void;
}

export function BreakfastOrder({ booking, onUpdate }: BreakfastOrderProps) {
    const [loading, setLoading] = useState(false);
    const [selectedTime, setSelectedTime] = useState('09:00');

    const handleOrder = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('bookings')
            .update({
                breakfast_ordered: true,
                breakfast_status: 'requested',
                breakfast_time: selectedTime
            })
            .eq('id', booking.id);

        setLoading(false);
        if (!error) {
            onUpdate();
        }
    };

    const status = booking.breakfast_status;

    if (status === 'approved') {
        return (
            <Card className="border-l-4 border-l-green-500 bg-green-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-5 w-5" />
                        הזמנת ארוחת הבוקר אושרה
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-600 mb-2">שעה: <span className="font-semibold">{booking.breakfast_time}</span></p>
                    {booking.breakfast_menu && (
                        <div className="bg-white p-4 rounded-lg border border-green-100 mt-2">
                            <h4 className="font-medium text-green-800 mb-1">התפריט שלך:</h4>
                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{booking.breakfast_menu}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (status === 'requested') {
        return (
            <Card className="border-l-4 border-l-yellow-400 bg-yellow-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-700">
                        <Clock className="h-5 w-5" />
                        בקשתך בטיפול
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-gray-600">
                        ביקשת ארוחת בוקר לשעה <span className="font-semibold">{booking.breakfast_time}</span>.
                        <br />
                        הבקשה נשלחה למארח וממתינה לאישור.
                    </p>
                </CardContent>
            </Card>
        );
    }

    // State: none
    return (
        <Card className="bg-white">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Coffee className="text-secondary h-5 w-5" />
                    ארוחת בוקר גלילית
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-gray-500 mb-4 text-sm">
                    התפנקו בארוחת בוקר עשירה מתוצרת מקומית.
                </p>
                <div className="flex flex-col gap-3">
                    <label className="text-sm font-medium">בחר שעה מועדפת:</label>
                    <div className="flex gap-2">
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                        >
                            <option value="08:00">08:00</option>
                            <option value="08:30">08:30</option>
                            <option value="09:00">09:00</option>
                            <option value="09:30">09:30</option>
                            <option value="10:00">10:00</option>
                        </select>
                        <Button onClick={handleOrder} isLoading={loading}>
                            הזמן
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
