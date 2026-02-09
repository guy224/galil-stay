import React, { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { addDays, format, differenceInDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
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
    const [date, setDate] = useState<DateRange | undefined>();
    const [guestName, setGuestName] = useState('');
    const [guestPhone, setGuestPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const totalNights = date?.from && date?.to
        ? differenceInDays(date.to, date.from)
        : 0;

    const totalPrice = totalNights * basePrice;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!date?.from || !date?.to || !guestName || !guestPhone) {
            setError('נא למלא את כל השדות');
            return;
        }

        setLoading(true);
        setError(null);

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

        setLoading(false);

        if (insertError) {
            console.error(insertError);
            setError('אירעה שגיאה בביצוע ההזמנה. נסה שנית.');
        } else {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur">
                <CardContent className="pt-6 text-center">
                    <div className="mb-4 text-primary text-5xl">✓</div>
                    <h3 className="text-2xl font-bold mb-2">הבקשה נשלחה!</h3>
                    <p className="text-muted-foreground mb-4">
                        תודה {guestName}, קיבלנו את פרטי ההזמנה.
                        <br />
                        ניצור איתך קשר בהקדם לאישור סופי.
                    </p>
                    <Button onClick={() => setSuccess(false)} variant="outline">
                        ביצוע הזמנה נוספת
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur shadow-lg border-primary/20">
            <CardHeader>
                <CardTitle className="text-center text-primary">בדיקת זמינות והזמנה</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">תאריכים</label>
                        <div className="flex justify-center border rounded-md p-2 bg-white">
                            <Calendar
                                mode="range"
                                selected={date}
                                onSelect={setDate}
                                numberOfMonths={1}
                                disabled={(date) => date < new Date()}
                            />
                        </div>
                    </div>

                    {totalNights > 0 && (
                        <div className="bg-primary/10 p-3 rounded-md flex justify-between items-center text-sm">
                            <span>{totalNights} לילות</span>
                            <span className="font-bold text-lg">{totalPrice} ₪</span>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium">שם מלא</label>
                        <Input
                            placeholder="ישראל ישראלי"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">טלפון</label>
                        <Input
                            placeholder="050-0000000"
                            className="text-right"
                            dir="ltr"
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                    <Button type="submit" className="w-full" size="lg" isLoading={loading}>
                        שלח בקשת הזמנה
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
