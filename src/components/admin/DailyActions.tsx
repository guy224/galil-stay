import React, { useState } from 'react';
import { Booking } from '../../types/supabase';
import { isSameDay, addDays, parseISO, isToday } from 'date-fns';
import { Car, LogOut, Sun, ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { ActionConfirmModal } from './ActionConfirmModal';
import { MessageType } from '../../utils/whatsappUtils';

interface DailyActionsProps {
    bookings: Booking[];
    onUpdate?: () => Promise<void>;
}

export function DailyActions({ bookings }: DailyActionsProps) {
    const [selectedAction, setSelectedAction] = useState<{ booking: Booking; type: MessageType } | null>(null);

    const today = new Date();
    const tomorrow = addDays(today, 1);

    // 1. Upcoming Arrivals (Tomorrow) - Status: approved, Check-in: tomorrow
    const upcomingArrivals = bookings.filter(b =>
        b.status === 'approved' && isSameDay(parseISO(b.check_in), tomorrow)
    );

    // 2. Today's Departures - Status: approved, Check-out: today
    const todaysDepartures = bookings.filter(b =>
        b.status === 'approved' && isSameDay(parseISO(b.check_out), today)
    );

    if (upcomingArrivals.length === 0 && todaysDepartures.length === 0) return null;

    return (
        <section className="animate-in slide-in-from-top-4 duration-500 mb-2">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                    <Sun className="h-5 w-5 text-orange-500" />
                </div>
                פעולות מומלצות להיום
            </h2>

            <div className="grid grid-cols-1 gap-4">
                {/* Arrival Cards */}
                {upcomingArrivals.map(booking => (
                    <Card key={`arrival-${booking.id}`} className="border-none shadow-md shadow-blue-100/50 bg-white rounded-xl overflow-hidden ring-1 ring-blue-50">
                        <div className="h-1 bg-blue-500 w-full"></div>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                                    <Car className="h-3.5 w-3.5" /> מגיע מחר
                                </div>
                                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">
                                    {booking.unit_type === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{booking.guest_name}</h3>
                            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                מתקרב מועד ההגעה. מומלץ לשלוח הודעת ברוכים הבאים עם קוד לשער והוראות הגעה.
                            </p>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 rounded-xl h-11"
                                onClick={() => setSelectedAction({ booking, type: 'arrival' })}
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                שלח הוראות הגעה בוואטסאפ
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {/* Departure Cards */}
                {todaysDepartures.map(booking => (
                    <Card key={`departure-${booking.id}`} className="border-none shadow-md shadow-orange-100/50 bg-white rounded-xl overflow-hidden ring-1 ring-orange-50">
                        <div className="h-1 bg-orange-500 w-full"></div>
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-3">
                                <div className="bg-orange-50 text-orange-700 px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                                    <LogOut className="h-3.5 w-3.5" /> עוזב היום
                                </div>
                                <span className="text-xs text-gray-400 font-medium bg-gray-50 px-2 py-1 rounded">
                                    {booking.unit_type === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-1">{booking.guest_name}</h3>
                            <p className="text-sm text-gray-500 mb-5 leading-relaxed">
                                האורח אמור לפנות את היחידה היום. זו הזדמנות לשלוח תזכורת או להציע צ'ק-אאוט מאוחר.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    variant="outline"
                                    className="h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                                    onClick={() => setSelectedAction({ booking, type: 'checkout_reminder' })}
                                >
                                    שלח תזכורת
                                </Button>
                                <Button
                                    className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-200 h-11 rounded-xl"
                                    onClick={() => setSelectedAction({ booking, type: 'late_checkout_offer' })}
                                >
                                    הצע הארכה ($)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Modal */}
            <ActionConfirmModal
                isOpen={!!selectedAction}
                onClose={() => setSelectedAction(null)}
                booking={selectedAction?.booking || null}
                actionType={selectedAction?.type || null}
                title={selectedAction?.type === 'arrival' ? 'שליחת הוראות הגעה' : 'הודעת יציאה / הארכה'}
            />
        </section>
    );
}
