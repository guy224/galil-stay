```
import React from 'react';
import { X, MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Booking } from '../../types/supabase';
import { generateMessageText, generateWhatsAppLink } from '../../utils/whatsappUtils';
import type { MessageType } from '../../utils/whatsappUtils';

interface ActionConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    booking: Booking | null;
    actionType: MessageType | null;
    title?: string;
}

export function ActionConfirmModal({ isOpen, onClose, booking, actionType, title }: ActionConfirmModalProps) {
    if (!isOpen || !booking || !actionType) return null;

    const messageText = generateMessageText(booking, actionType);
    const whatsappLink = generateWhatsAppLink(booking, actionType);

    const handleSend = () => {
        window.open(whatsappLink, '_blank');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="bg-green-600 p-6 text-white text-center">
                    <div className="mx-auto bg-green-500 w-12 h-12 rounded-full flex items-center justify-center mb-3 shadow-sm">
                        <MessageCircle className="h-6 w-6" />
                    </div>
                    <h2 className="text-xl font-bold">{title || "הפעולה בוצעה בהצלחה!"}</h2>
                    <p className="text-green-100 text-sm mt-1">האם לשלוח הודעת עדכון לאורח?</p>

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-green-100 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                        תצוגה מקדימה להודעה:
                    </div>

                    <div className="bg-green-50/50 p-4 rounded-xl border border-green-100 text-gray-800 text-sm whitespace-pre-wrap leading-relaxed relative">
                        {messageText}
                        <div className="absolute bottom-2 left-2 text-[10px] text-gray-400">Preview</div>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" onClick={onClose} className="flex-1">
                            לא תודה, סגור
                        </Button>
                        <Button
                            onClick={handleSend}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-100"
                        >
                            שלח הודעה
                            <ExternalLink className="mr-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
