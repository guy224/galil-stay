export interface Booking {
    id: string;
    created_at: string;
    guest_name: string;
    guest_phone: string;
    guest_email?: string;
    unit_type: 'villa' | 'zimmer';
    check_in: string; // YYYY-MM-DD
    check_out: string; // YYYY-MM-DD
    total_price: number;
    status: 'pending' | 'approved' | 'declined';

    // V3 Advanced Features
    is_clean: boolean;
    gate_code: string;

    // Breakfast Logic
    breakfast_ordered: boolean;
    breakfast_time?: string;
    breakfast_menu?: string;
    breakfast_status: 'none' | 'requested' | 'approved';

    // Guest Interactions
    guest_complaint?: string;

    // Guest Composition
    adults: number;
    children: number;
    infants: number;
    pets: number;

    // Admin Fields
    source?: string;
    internal_notes?: string;
}

export interface Unit {
    id: string; // 'villa' | 'zimmer'
    name: string;
    base_price_weekday: number;
    base_price_weekend: number;
    default_min_nights: number;
}

export interface SeasonalPrice {
    id: string;
    unit_id: string;
    name: string;
    start_date: string;
    end_date: string;
    price_per_night: number;
    min_nights: number;
}
