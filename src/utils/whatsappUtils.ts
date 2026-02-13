import { Booking } from '../types/supabase';
import { format } from 'date-fns';

type MessageType = 'confirmed' | 'arrival' | 'breakfast';

export const generateWhatsAppLink = (booking: Booking, type: MessageType): string => {
    // 1. Format Phone to International (972)
    let phone = booking.guest_phone.replace(/\D/g, ''); // Remove non-digits
    if (phone.startsWith('0')) {
        phone = '972' + phone.substring(1);
    }

    // 2. Prepare Data Helpers
    const guestName = booking.guest_name.split(' ')[0]; // First name only
    const dates = `${format(new Date(booking.check_in), 'dd/MM')} - ${format(new Date(booking.check_out), 'dd/MM')}`;
    const unitName = booking.unit_type === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים';
    const wazeLink = "https://waze.com/ul/hsvc4g285f"; // Generic placeholder or specific if known. Using a generic northern location for now.
    const gateCode = booking.gate_code || "1234"; // Fallback if empty
    const breakfastTime = booking.breakfast_time || "09:00";

    // 3. Select Template
    let message = "";

    switch (type) {
        case 'confirmed':
            message = `היי ${guestName}! 👋 איזה כיף, ההזמנה שלכם ב-Galil Stay אושרה! 🎉\n🗓 תאריכים: ${dates}\n🏡 יחידה: ${unitName}\nאנחנו כבר מתחילים להכין את המקום בשבילכם. נתראה בקרוב! 🌿`;
            break;

        case 'arrival':
            message = `היי ${guestName}, מתרגשים לקראתכם מחר! 😍\nהנה הפרטים להגעה:\n📍 ניווט בוייז: ${wazeLink}\n🔑 קוד לשער: ${gateCode}\nסעו בזהירות! 🚗`;
            break;

        case 'breakfast':
            message = `בוקר טוב ${guestName}! ☀️ רק מעדכנים שארוחת הבוקר הגלילית שלכם רשומה לשעה ${booking.breakfast_time}. שיהיה בתיאבון! 🥐🧀`;
            break;
    }

    // 4. Encode and Return
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
