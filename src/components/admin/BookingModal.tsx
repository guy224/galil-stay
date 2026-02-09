import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, MessageCircle, Broom, Coffee, Check, Save } from 'lucide-react';
import { Booking } from '../../types/supabase';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

interface BookingModalProps {
    booking: Booking;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: () => void;
}

export function BookingModal({ booking, isOpen, onClose, onUpdate }: BookingModalProps) {
    const [loading, setLoading] = useState(false);
    const [breakfastMenu, setBreakfastMenu] = useState(booking.breakfast_menu || '');
    const { addToast } = useToast();

    if (!isOpen) return null;

    // --- Logic 1: WhatsApp Generator ---
    const generateWhatsAppLink = () => {
        const phone = booking.guest_phone.replace(/^0/, '972').replace(/\D/g, ''); // Ensure clean number
        const guestUrl = `${window.location.origin}/guest/${booking.id}`;
        let message = "";

        if (booking.is_clean) {
            message = `היי ${booking.guest_name}, החדר מוכן והקוד לשער מחכה לך באפליקציה! 🏠 חופשה נעימה.\n\n לפרטים: ${guestUrl}`;
        } else if (booking.status === 'approved') {
            message = `היי ${booking.guest_name}, ההזמנה אושרה! איזה כיף.\nלניהול החופשה ופרטים נוספים: ${guestUrl}`;
        } else {
            message = `היי ${booking.guest_name}, תודה על ההזמנה! אנחנו בודקים את הפרטים ונחזור אליך בהקדם.`;
        }

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    };

    // --- Logic 2: Cleaning Toggle ---
    const toggleClean = async (checked: boolean) => {
        const { error } = await supabase
            .from('bookings')
            .update({ is_clean: checked })
            .eq('id', booking.id);

        if (!error) {
            onUpdate();
            addToast(checked ? 'החדר סומן כנקי! הקוד נחשף לאורח.' : 'החדר סומן כלא נקי.', 'success');
        } else {
            addToast('שגיאה בעדכון הסטטוס', 'error');
        }
    };

    // --- Logic 3: Breakfast Approval ---
    const approveBreakfast = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('bookings')
            .update({
                breakfast_status: 'approved',
                breakfast_menu: breakfastMenu
            })
            .eq('id', booking.id);

        setLoading(false);
        if (!error) {
            onUpdate();
            addToast('ארוחת הבוקר אושרה והתפריט נשמר', 'success');
        } else {
            addToast('שגיאה בשמירת התפריט', 'error');
        }
    };

    // --- Logic 4: Booking Approval (General) ---
    const approveBooking = async () => {
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'approved' })
            .eq('id', booking.id);

        if (!error) {
            onUpdate();
            addToast('ההזמנה אושרה בהצלחה!', 'success');
        } else {
            addToast('שגיאה באישור ההזמנה', 'error');
        }
    }


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Mobile-first modal container: w-full, max-h-[90vh], proper scrolling */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg md:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header - Fixed */}
                <div className="p-4 md:p-6 border-b flex justify-between items-start bg-gray-50/80 backdrop-blur shrink-0">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h2 className="text-xl md:text-2xl font-bold line-clamp-1">{booking.guest_name}</h2>
                            <Badge variant={booking.status === 'approved' ? 'success' : 'warning'}>
                                {booking.status === 'approved' ? 'מאושר' : 'ממתין'}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            {booking.unit_type === 'villa' ? 'בית גלילי' : 'צימר בין הנחלים'}
                            <span>•</span>
                            {format(new Date(booking.check_in), 'dd/MM/yyyy')} - {format(new Date(booking.check_out), 'dd/MM/yyyy')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 md:p-6 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* 1. Status & General Actions */}
                    {booking.status === 'pending' && (
                        <div className="bg-yellow-50 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-center border border-yellow-100 gap-3 text-center sm:text-right">
                            <span className="text-yellow-800 font-medium">הזמנה זו ממתינה לאישור</span>
                            <Button onClick={approveBooking} size="sm" className="bg-yellow-600 hover:bg-yellow-700 text-white w-full sm:w-auto">
                                <Check className="h-4 w-4 mr-1" /> אשר הזמנה
                            </Button>
                        </div>
                    )}

                    {/* 2. Cleaning Control */}
                    <section className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-full ${booking.is_clean ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                                    <Broom className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">סטטוס ניקיון</h3>
                                    <p className="text-sm text-gray-500 hidden sm:block">
                                        {booking.is_clean ? 'החדר מסומן כנקי ומוכן לאורח' : 'החדר טרם מוכן'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium">{booking.is_clean ? 'נקי' : 'לא נקי'}</span>
                                <Switch
                                    checked={booking.is_clean}
                                    onCheckedChange={toggleClean}
                                />
                            </div>
                        </div>
                    </section>

                    {/* 3. Breakfast Manager */}
                    <section className="border rounded-xl overflow-hidden">
                        <div className="bg-gray-50 p-4 border-b flex items-center justify-between">
                            <h3 className="font-bold flex items-center gap-2">
                                <Coffee className="h-5 w-5 text-secondary" />
                                ניהול ארוחת בוקר
                            </h3>
                            {booking.breakfast_status === 'requested' && (
                                <Badge variant="warning">בקשה חדשה</Badge>
                            )}
                        </div>

                        <div className="p-4 space-y-4">
                            {booking.breakfast_ordered ? (
                                <>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="font-medium text-gray-600">שעה מבוקשת:</span>
                                        <span className="font-bold text-lg">{booking.breakfast_time}</span>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">תפריט הארוחה:</label>
                                        <textarea
                                            className="w-full min-h-[80px] p-3 rounded-md border border-input focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                                            placeholder="כתוב כאן מה מוגש לאורח..."
                                            dir="rtl"
                                            value={breakfastMenu}
                                            onChange={(e) => setBreakfastMenu(e.target.value)}
                                        />
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={approveBreakfast}
                                            isLoading={loading}
                                            variant={booking.breakfast_status === 'approved' ? 'outline' : 'primary'}
                                            className="w-full sm:w-auto"
                                        >
                                            {booking.breakfast_status === 'approved' ? 'עדכן תפריט' : 'אשר ארוחה'}
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-gray-500 text-center py-4 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                                    האורח לא הזמין ארוחת בוקר
                                </p>
                            )}
                        </div>
                    </section>

                    {/* 4. WhatsApp Action */}
                    <div className="pt-2">
                        <a
                            href={generateWhatsAppLink()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full"
                        >
                            <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white h-12 text-lg shadow-lg shadow-green-200 transition-all hover:-translate-y-0.5">
                                <MessageCircle className="mr-2 h-5 w-5" />
                                שלח עדכון בוואטסאפ
                            </Button>
                        </a>
                    </div>

                </div>
            </div>
        </div>
    );
}
