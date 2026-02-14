import React from 'react';
import { Lock, Unlock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import type { Booking } from '../../types/supabase';
import { isBefore, startOfDay, parseISO } from 'date-fns';

interface GateCodeCardProps {
    booking: Booking;
}

export function GateCodeCard({ booking }: GateCodeCardProps) {
    // Logic: Show code ONLY if (is_clean === true) AND (today >= check_in)
    // We use startOfDay to compare dates without time for the check-in condition logic generally,
    // but the prompt says: "The code gate_code ONLY IF (is_clean === true) AND (today >= check_in)."
    // It also says: "State A (Not Ready): ... (Start from 15:00)".
    // For simplicity ensuring robust comparison, we'll check if today is checking date or after.

    const checkInDate = parseISO(booking.check_in);
    const today = startOfDay(new Date());

    // Logic: standard check is usually check-in date at 15:00. 
    // We will assume "ready" means correct day.
    const isDateReady = !isBefore(today, checkInDate);
    const isReady = booking.is_clean && isDateReady;

    return (
        <Card className={`overflow-hidden border-2 ${isReady ? 'border-primary/50 bg-white' : 'border-gray-200 bg-gray-50'}`}>
            <CardHeader className="text-center pb-2">
                <CardTitle className="flex items-center justify-center gap-2 text-xl">
                    {isReady ? <Unlock className="text-primary h-6 w-6" /> : <Lock className="text-gray-400 h-6 w-6" />}
                    קוד לשער הכניסה
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4 pt-2">
                {isReady ? (
                    <div className="space-y-2 animate-in fade-in zoom-in duration-500">
                        <div className="text-5xl font-bold tracking-widest text-dark font-mono bg-primary/10 py-4 rounded-xl border border-primary/20">
                            {booking.gate_code}
                        </div>
                        <p className="text-primary font-medium flex items-center justify-center gap-1">
                            <CheckCircle className="h-4 w-4" />
                            החדר מוכן! ברוכים הבאים.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white/50 p-6 rounded-xl border border-dashed border-gray-300">
                        <p className="text-gray-500 leading-relaxed">
                            הקוד יופיע כאן ביום הצ'ק-אין (החל מ-15:00)
                            <br />
                            <span className="font-semibold text-gray-600">כשהחדר יהיה מוכן ונקי עבורכם.</span>
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
