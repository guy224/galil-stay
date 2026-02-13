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
        <section className="animate-in slide-in-from-top-4 duration-500 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Sun className="h-5 w-5 text-orange-500" />
                פעולות מומלצות להיום
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* Arrival Cards */}
                {upcomingArrivals.map(booking => (
                    <Card key={`arrival-${booking.id}`} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <Car className="h-3 w-3" /> מגיע מחר
                                    </div>
                                    <span className="text-xs text-gray-400">{booking.unit_type === 'villa' ? 'וילה' : 'צימר'}</span>
                                </div>
                                <h3 className="font-bold text-gray-900">{booking.guest_name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    האם לשלוח הוראות הגעה וקוד לשער?
                                </p>
                            </div>
                            <Button
                                size="sm"
                                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => setSelectedAction({ booking, type: 'arrival' })}
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                שלח הוראות הגעה
                            </Button>
                        </CardContent>
                    </Card>
                ))}

                {/* Departure Cards */}
                {todaysDepartures.map(booking => (
                    <Card key={`departure-${booking.id}`} className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
                        <CardContent className="p-4 flex flex-col justify-between h-full">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="bg-orange-50 text-orange-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <LogOut className="h-3 w-3" /> עוזב היום
                                    </div>
                                    <span className="text-xs text-gray-400">{booking.unit_type === 'villa' ? 'וילה' : 'צימר'}</span>
                                </div>
                                <h3 className="font-bold text-gray-900">{booking.guest_name}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    האם להציע צ'ק-אאוט מאוחר או לשלוח תזכורת?
                                </p>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-xs px-1"
                                    onClick={() => setSelectedAction({ booking, type: 'checkout_reminder' })}
                                >
                                    תזכורת
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs px-1"
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
