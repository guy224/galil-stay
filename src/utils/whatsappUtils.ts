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
    const guestUrl = `${window.location.origin}/guest/${booking.id}`;
    const breakfastTime = booking.breakfast_time || "09:00";

    // 3. Select Template
    let message = "";

    switch (type) {
        case 'confirmed':
            message = `היי ${guestName}! 👋 ההזמנה אושרה! 🎉\n🗓 תאריכים: ${dates}\n🏡 יחידה: ${unitName}\n\nלכל הפרטים והוראות ההגעה, כנסו לאזור האישי שלכם:\n${guestUrl}`;
            break;

        case 'arrival':
            // "Arrival" is now mostly covered by the Guest Portal link in 'confirmed', 
            // but we keep this for specific day-before reminders if needed.
            // The user asked for "Check-in Info" to include the link.
            message = `היי ${guestName}, מחכים לראותכם מחר! 😍\n\nלניווט וקוד לשער, כנסו לקישור:\n${guestUrl}\n\nסעו בזהירות! 🚗`;
            break;

        case 'breakfast':
            message = `היי ${guestName}, אישרנו את ארוחת הבוקר לשעה ${breakfastTime} 🍳.\nלפרטים נוספים וצפייה בתפריט:\n${guestUrl}`;
            break;
    }

    // 4. Encode and Return
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
