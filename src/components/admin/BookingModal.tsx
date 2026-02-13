import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, MessageCircle, Sparkles, Coffee, Check, Save, User, Calendar, Phone, Send } from 'lucide-react';
import { Booking } from '../../types/supabase';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { generateWhatsAppLink } from '../../utils/whatsappUtils';

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

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        }
    }, [isOpen]);

    if (!isOpen) return null;

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
        <div className="fixed inset-0 z-[100] flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="relative z-[101] w-full max-w-md bg-white h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col border-r border-gray-100">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{booking.guest_name}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            {booking.unit_type === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים'}
                            <span>•</span>
                            <Badge variant={booking.status === 'approved' ? 'success' : 'warning'}>
                                {booking.status === 'approved' ? 'מאושר' : 'ממתין'}
                            </Badge>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-900"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Guest Details Card */}
                    <div className="space-y-4">
                        <h3 className="uppercase text-xs font-bold text-gray-400 tracking-wider">פרטי הזמנה</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <Calendar className="h-4 w-4" /> check-in
                                </div>
                                <div className="font-semibold">{format(new Date(booking.check_in), 'dd/MM/yyyy')}</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <Calendar className="h-4 w-4" /> check-out
                                </div>
                                <div className="font-semibold">{format(new Date(booking.check_out), 'dd/MM/yyyy')}</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <Phone className="h-4 w-4" /> טלפון
                                </div>
                                <div className="font-semibold" dir="ltr">{booking.guest_phone}</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <div className="flex items-center gap-2 text-gray-500 mb-1">
                                    <User className="h-4 w-4" /> הרכב (עודכן)
                                </div>
                                <div className="font-semibold">
                                    {booking.adults} מבוגרים, {booking.children} ילדים
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp Communication Engine */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <h3 className="uppercase text-xs font-bold text-gray-400 tracking-wider">תקשורת עם האורח</h3>
                            <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-green-50 text-green-700 hover:bg-green-100">WhatsApp Engine</Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <a
                                href={generateWhatsAppLink(booking, 'confirmed')}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full"
                            >
                                <Button variant="outline" className="w-full justify-start text-green-700 bg-green-50 hover:bg-green-100 border-green-200">
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    שלח אישור הזמנה (וואטסאפ)
                                </Button>
                            </a>

                            <a
                                href={generateWhatsAppLink(booking, 'arrival')}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full"
                            >
                                <Button variant="outline" className="w-full justify-start text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200">
                                    <Send className="h-4 w-4 mr-2" />
                                    שלח הוראות הגעה וקוד
                                </Button>
                            </a>

                            {booking.breakfast_ordered && (
                                <a
                                    href={generateWhatsAppLink(booking, 'breakfast')}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="w-full"
                                >
                                    <Button variant="outline" className="w-full justify-start text-orange-700 bg-orange-50 hover:bg-orange-100 border-orange-200">
                                        <Coffee className="h-4 w-4 mr-2" />
                                        שלח אישור ארוחת בוקר
                                    </Button>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* 1. Status & General Actions */}
                    {booking.status === 'pending' && (
                        <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 text-center space-y-3">
                            <h3 className="font-bold text-orange-800">הזמנה זו ממתינה לאישור</h3>
                            <p className="text-sm text-orange-700">יש לוודא זמינות ביומן לפני האישור הסופי.</p>
                            <Button onClick={approveBooking} className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                <Check className="h-4 w-4 mr-2" /> אשר הזמנה
                            </Button>
                        </div>
                    )}

                    {/* 2. Cleaning Control */}
                    <div className="space-y-4">
                        <h3 className="uppercase text-xs font-bold text-gray-400 tracking-wider">ניהול יחידה</h3>
                        <div className="bg-white p-4 rounded-xl border shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-full ${booking.is_clean ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="font-medium">ניקיון ומוכנות</div>
                                    <div className="text-xs text-gray-500">{booking.is_clean ? 'מוכן לכניסה' : 'לא מוכן'}</div>
                                </div>
                            </div>
                            <Switch checked={booking.is_clean} onCheckedChange={toggleClean} />
                        </div>
                    </div>

                    {/* 3. Breakfast Manager */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="uppercase text-xs font-bold text-gray-400 tracking-wider">ארוחת בוקר</h3>
                            {booking.breakfast_status === 'requested' && <Badge variant="warning">בקשה חדשה</Badge>}
                        </div>

                        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                            {booking.breakfast_ordered ? (
                                <div className="p-4 space-y-4">
                                    <div className="flex justify-between items-center pb-3 border-b border-dashed">
                                        <span className="text-sm text-gray-600">שעה מבוקשת</span>
                                        <Badge variant="outline" className="text-lg px-3 py-1 bg-gray-50">{booking.breakfast_time}</Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-700">תפריט / הערות למטבח</label>
                                        <textarea
                                            className="w-full min-h-[100px] p-3 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm"
                                            placeholder="פירוט הארוחה..."
                                            value={breakfastMenu}
                                            onChange={(e) => setBreakfastMenu(e.target.value)}
                                        />
                                    </div>

                                    <Button
                                        onClick={approveBreakfast}
                                        isLoading={loading}
                                        className="w-full"
                                        variant={booking.breakfast_status === 'approved' ? 'outline' : 'primary'}
                                    >
                                        {booking.breakfast_status === 'approved' ? 'עדכן תפריט' : 'אשר ארוחה'}
                                    </Button>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-gray-400 bg-gray-50/50">
                                    <Coffee className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">לא הוזמנה ארוחת בוקר</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions - REMOVED GENERIC WHATSAPP */}

            </div>
        </div>
    );
}
