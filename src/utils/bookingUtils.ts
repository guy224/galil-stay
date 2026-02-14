import { differenceInDays, isFriday, isSaturday, isThursday, parseISO, eachDayOfInterval, isWithinInterval, addDays } from 'date-fns';
import { supabase } from '../lib/supabase';
import type { Unit, SeasonalPrice } from '../types/supabase';

// Helper to fetch pricing rules
export async function getPricingRules(unitId: string) {
    const { data: unit, error: unitError } = await supabase
        .from('units')
        .select('*')
        .eq('id', unitId)
        .single();

    if (unitError) {
        console.error("Error fetching unit:", unitError);
        return null;
    }

    const { data: seasonal, error: seasonalError } = await supabase
        .from('seasonal_prices')
        .select('*')
        .eq('unit_id', unitId);

    if (seasonalError) {
        console.error("Error fetching seasonal prices:", seasonalError);
    }

    return {
        unit: unit as Unit,
        seasonal: (seasonal || []) as SeasonalPrice[]
    };
}

export function calculatePrice(
    checkIn: Date,
    checkOut: Date,
    unit: Unit,
    seasonalPrices: SeasonalPrice[]
): { totalPrice: number, breakdown: { date: string, type: string, price: number }[] } {

    const nights = eachDayOfInterval({
        start: checkIn,
        end: addDays(checkOut, -1) // e.g. if check-in 10th, check-out 12th, we pay for 10th and 11th.
    });

    let totalPrice = 0;
    const breakdown = [];

    for (const date of nights) {
        let price = 0;
        let type = 'רגיל';

        // 1. Check Seasonal
        const season = seasonalPrices.find(s =>
            isWithinInterval(date, { start: parseISO(s.start_date), end: parseISO(s.end_date) })
        );

        if (season) {
            price = season.price_per_night;
            type = season.name;
        } else {
            // 2. Check Weekend (Thu, Fri, Sat)
            if (isThursday(date) || isFriday(date) || isSaturday(date)) {
                price = unit.base_price_weekend;
                type = 'סופ"ש';
            } else {
                // 3. Weekday
                price = unit.base_price_weekday;
                type = 'אמצ"ש';
            }
        }

        totalPrice += price;
        breakdown.push({
            date: date.toISOString().split('T')[0],
            type,
            price
        });
    }

    return { totalPrice, breakdown };
}

export function getMinNights(checkIn: Date, unit: Unit, seasonalPrices: SeasonalPrice[]): number {
    // Logic: If the check-in date falls in a special period, use its min_nights.
    // Otherwise use default.
    // (A more complex logic might check if *any* day in the range requires min_nights, 
    // but usually check-in date is the determiner).

    const season = seasonalPrices.find(s =>
        isWithinInterval(checkIn, { start: parseISO(s.start_date), end: parseISO(s.end_date) })
    );

    if (season) return season.min_nights;
    return unit.default_min_nights;
}
