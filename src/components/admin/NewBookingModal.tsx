import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Save, Upload, Banknote, FileText, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Booking, Unit, SeasonalPrice } from '../../types/supabase';
import { useToast } from '../ui/Toast';
import { getPricingRules, calculatePrice } from '../../utils/bookingUtils';
import { parseISO } from 'date-fns';

interface NewBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (booking: Booking) => void;
}

export function NewBookingModal({ isOpen, onClose, onSuccess }: NewBookingModalProps) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [pricingLoading, setPricingLoading] = useState(false);

    // Pricing Rules State
    const [rules, setRules] = useState<{ unit: Unit, seasonal: SeasonalPrice[] } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        unit_type: 'villa' as 'villa' | 'zimmer', // default
        check_in: '',
        check_out: '',
        adults: 2,
        children: 0,
        infants: 0,
        pets: 0,
        total_price: 0,
        source: 'Phone',
        internal_notes: ''
    });

    // Fetch Rules when unit changes
    useEffect(() => {
        const fetchRules = async () => {
            setPricingLoading(true);
            const data = await getPricingRules(formData.unit_type);
            if (data) {
                setRules(data);
                // Recalculate price if dates are set
                if (formData.check_in && formData.check_out) {
                    const priceData = calculatePrice(parseISO(formData.check_in), parseISO(formData.check_out), data.unit, data.seasonal);
                    setFormData(prev => ({ ...prev, total_price: priceData.totalPrice }));
                }
            }
            setPricingLoading(false);
        };
        fetchRules();
    }, [formData.unit_type]);

    // Recalculate Price when dates change
    useEffect(() => {
        if (rules && formData.check_in && formData.check_out) {
            const priceData = calculatePrice(parseISO(formData.check_in), parseISO(formData.check_out), rules.unit, rules.seasonal);
            setFormData(prev => ({ ...prev, total_price: priceData.totalPrice }));
        }
    }, [formData.check_in, formData.check_out, rules]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'total_price' || name === 'adults' || name === 'children' || name === 'infants' || name === 'pets'
                ? Number(value)
                : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const newBooking = {
            ...formData,
            status: 'approved', // Manual bookings are usually approved immediately
            is_clean: false, // Default dirty
            breakfast_ordered: false, // Default no breakfast
            breakfast_status: 'none',
            created_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('bookings')
            .insert([newBooking])
            .select()
            .single();

        setLoading(false);

        if (error) {
            console.error('Error creating booking:', error);
            addToast('שגיאה ביצירת ההזמנה. נסה שוב.', 'error');
        } else {
            addToast('ההזמנה נוצרה בהצלחה!', 'success');
            onSuccess(data as Booking);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-gray-50 border-b p-6 flex justify-between items-center sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">הזמנה חדשה (ידנית)</h2>
                        <p className="text-sm text-gray-500">הזנת פרטים ידנית למערכת</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">

                    {/* Section 1: Guest Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                            <User className="h-4 w-4 text-primary" /> פרטי אורח
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">שם מלא *</label>
                                <Input required name="guest_name" value={formData.guest_name} onChange={handleChange} placeholder="לדוגמה: ישראל ישראלי" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">טלפון *</label>
                                <Input required name="guest_phone" value={formData.guest_phone} onChange={handleChange} placeholder="050-0000000" dir="ltr" />
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-medium text-gray-700">אימייל (אופציונלי)</label>
                                <Input name="guest_email" value={formData.guest_email} onChange={handleChange} placeholder="email@example.com" dir="ltr" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Section 2: Stay Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                            <Calendar className="h-4 w-4 text-primary" /> פרטי אירוח
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">יחידה *</label>
                                <div className="relative">
                                    <select
                                        name="unit_type"
                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        value={formData.unit_type}
                                        onChange={handleChange}
                                    >
                                        <option value="villa">וילה בגליל</option>
                                        <option value="zimmer">צימר בין הנחלים</option>
                                    </select>
                                    {pricingLoading && <Loader2 className="absolute left-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">מקור הגעה</label>
                                <select
                                    name="source"
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.source}
                                    onChange={handleChange}
                                >
                                    <option value="Phone">טלפוני</option>
                                    <option value="WhatsApp">WhatsApp</option>
                                    <option value="Airbnb">Airbnb</option>
                                    <option value="Booking.com">Booking.com</option>
                                    <option value="Other">אחר / חברים</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">צ'ק-אין *</label>
                                <Input required type="date" name="check_in" value={formData.check_in} onChange={handleChange} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">צ'ק-אאוט *</label>
                                <Input required type="date" name="check_out" value={formData.check_out} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Composition */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 grid grid-cols-4 gap-2 text-center">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">מבוגרים</label>
                                <Input type="number" min="1" name="adults" value={formData.adults} onChange={handleChange} className="h-8 text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">ילדים</label>
                                <Input type="number" min="0" name="children" value={formData.children} onChange={handleChange} className="h-8 text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">תינוקות</label>
                                <Input type="number" min="0" name="infants" value={formData.infants} onChange={handleChange} className="h-8 text-center" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500">חיות מחמד</label>
                                <Input type="number" min="0" name="pets" value={formData.pets} onChange={handleChange} className="h-8 text-center" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Section 3: Financials & Notes */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-wide">
                            <Banknote className="h-4 w-4 text-primary" /> כספים ומנהלה
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-gray-700">מחיר כולל (₪) *</label>
                                <Input required type="number" name="total_price" value={formData.total_price} onChange={handleChange} placeholder="0" className="text-lg font-bold" />
                                <p className="text-[10px] text-gray-400">מחושב אוטומטית (ניתן לעריכה)</p>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-medium text-gray-700">הערות פנימיות (מנהל)</label>
                                <textarea
                                    name="internal_notes"
                                    value={formData.internal_notes}
                                    onChange={handleChange}
                                    className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="רשימות פרטיות למנהל (לא מוצג לאורח)..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white z-10">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            ביטול
                        </Button>
                        <Button type="submit" isLoading={loading} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                            <Save className="h-4 w-4 mr-2" />
                            שמור והפק הזמנה
                        </Button>
                    </div>

                </form>
            </div>
        </div>
    );
}
