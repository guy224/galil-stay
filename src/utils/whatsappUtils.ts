import { Booking } from '../types/supabase';
import { format } from 'date-fns';

export type MessageType = 'confirmed' | 'arrival' | 'breakfast' | 'checkout_reminder' | 'late_checkout_offer';

export const generateMessageText = (booking: Booking, type: MessageType): string => {
    // Helpers
    const guestName = booking.guest_name.split(' ')[0];
    const dates = `${format(new Date(booking.check_in), 'dd/MM')} - ${format(new Date(booking.check_out), 'dd/MM')}`;
    const unitName = booking.unit_type === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים';
    const guestUrl = `${window.location.origin}/guest/${booking.id}`;
    const breakfastTime = booking.breakfast_time || "09:00";
    const lateCheckoutPrice = booking.unit_type === 'villa' ? '250' : '150'; // Example default prices

    switch (type) {
        case 'confirmed':
            return `היי ${guestName}! 👋 ההזמנה אושרה! 🎉\n🗓 תאריכים: ${dates}\n🏡 יחידה: ${unitName}\n\nלכל הפרטים והוראות ההגעה, כנסו לאזור האישי שלכם:\n${guestUrl}`;

        case 'arrival':
            return `היי ${guestName}, מחכים לראותכם מחר! 😍\n\nלניווט וקוד לשער, כנסו לקישור:\n${guestUrl}\n\nסעו בזהירות! 🚗`;

        case 'breakfast':
            return `היי ${guestName}, אישרנו את ארוחת הבוקר לשעה ${breakfastTime} 🍳.\nלפרטים נוספים וצפייה בתפריט:\n${guestUrl}`;

        case 'checkout_reminder':
            return `היי ${guestName}, מקווים שנהניתם! רק מזכירים שהצ'ק-אאוט הוא עד השעה 11:00.\n\nלסיום ותשלום (אם נותר), כנסו לאזור האישי:\n${guestUrl}\n\nנשמח לראותכם שוב! 😊`;

        case 'late_checkout_offer':
            return `היי ${guestName}, מקווים שאתם נהנים מהבוקר האחרון בגליל! 🌿\nרוצים להישאר עוד קצת? ניתן להוסיף צ'ק-אאוט מאוחר בתוספת של ${lateCheckoutPrice} ש"ח.\n\nמעוניינים? שלחו לנו הודעה חזרה!`; // Keeping it simple for reply
    }
};

export const generateWhatsAppLink = (booking: Booking, type: MessageType): string => {
    // Format Phone
    let phone = booking.guest_phone.replace(/\D/g, '');
    if (phone.startsWith('0')) {
        phone = '972' + phone.substring(1);
    }

    const message = generateMessageText(booking, type);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
};
