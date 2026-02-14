import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { supabase } from '../../lib/supabase';
import type { Booking } from '../../types/supabase';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    onUpdate: () => void;
}

export function PaymentModal({ isOpen, onClose, booking, onUpdate }: PaymentModalProps) {
    const [amountPaid, setAmountPaid] = useState<string>('0');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (booking) {
            setAmountPaid((booking.amount_paid || 0).toString());
        }
    }, [booking]);

    if (!isOpen || !booking) return null;

    const total = booking.total_price || 0;
    const currentPaid = parseInt(amountPaid) || 0;
    const remaining = total - currentPaid;

    const handleSave = async () => {
        setLoading(true);
        const { error } = await supabase
            .from('bookings')
            .update({
                amount_paid: currentPaid
                // payment_status is generated automatically by DB triggers/generated columns if set up,
                // otherwise we might need to set it here. 
                // The user's SQL had a generated column, so we just update amount_paid.
            })
            .eq('id', booking.id);

        setLoading(false);

        if (error) {
            console.error('Error updating payment:', error);
            alert('שגיאה בעדכון התשלום');
        } else {
            onUpdate();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-lg text-gray-900">עדכון תשלום</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="text-sm text-blue-800">סה"כ לתשלום:</div>
                        <div className="text-lg font-bold text-blue-900">₪{total.toLocaleString()}</div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">סכום ששולם בפועל</label>
                        <div className="relative">
                            <Input
                                type="number"
                                value={amountPaid}
                                onChange={(e) => setAmountPaid(e.target.value)}
                                className="pl-4 text-left font-mono text-lg"
                                autoFocus
                            />
                            <span className="absolute left-3 top-2.5 text-gray-400">₪</span>
                        </div>
                    </div>

                    <div className={`p-3 rounded-lg border flex justify-between items-center ${remaining > 0 ? 'bg-orange-50 border-orange-100 text-orange-800' : 'bg-green-50 border-green-100 text-green-800'
                        }`}>
                        <span className="text-sm font-medium">יתרה לתשלום:</span>
                        <span className="text-lg font-bold">₪{remaining.toLocaleString()}</span>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="outline" onClick={onClose}>ביטול</Button>
                        <Button onClick={handleSave} isLoading={loading}>
                            <Check className="h-4 w-4 mr-2" />
                            שמור תשלום
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
