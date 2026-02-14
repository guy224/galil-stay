import React, { useEffect, useState } from 'react';
import { format, differenceInDays, parseISO, isWithinInterval } from 'date-fns';
import { Loader2, Search, MoreVertical, Check, X, User, Baby, Cat, CalendarOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Booking } from '../../types/supabase';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BookingModal } from './BookingModal';
import { ActionConfirmModal } from './ActionConfirmModal';
import type { MessageType } from '../../utils/whatsappUtils';

interface BookingListProps {
    initialBookings?: Booking[];
    onUpdate?: () => void | Promise<void>;
    filterDate?: Date | null;
    onClearFilter?: () => void;
}

export function BookingList({ initialBookings, onUpdate, filterDate, onClearFilter }: BookingListProps) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings || []);
    const [loading, setLoading] = useState(!initialBookings);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    // ACTION TRIGGER STATE
    const [confirmAction, setConfirmAction] = useState<{ booking: Booking, type: MessageType, title: string } | null>(null);

    // Sync props to state if provided
    useEffect(() => {
        if (initialBookings) {
            setBookings(initialBookings);
            setLoading(false);
        } else {
            fetchBookings();
        }
    }, [initialBookings]);

    const fetchBookings = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching bookings:', error);
        else setBookings(data as Booking[]);
        setLoading(false);
    };

    const handleStatusUpdate = async (booking: Booking, newStatus: 'approved' | 'declined') => {
        setProcessingId(booking.id);
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', booking.id);

        setProcessingId(null);

        if (error) {
            console.error('Error updating status:', error);
            alert('שגיאה בעדכון הסטטוס');
        } else {
            // Update local state first to feel responsive
            if (onUpdate) await onUpdate();
            else fetchBookings();

            // IMMEDIATE ACTION TRIGGER
            if (newStatus === 'approved') {
                setConfirmAction({
                    booking,
                    type: 'confirmed',
                    title: 'ההזמנה אושרה בהצלחה!'
                });
            }
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.guest_name.includes(search) || b.guest_phone.includes(search);

        let matchesDate = true;
        if (filterDate) {
            // Check if filterDate is within booking range
            const start = parseISO(b.check_in);
            const end = parseISO(b.check_out);
            matchesDate = isWithinInterval(filterDate, { start, end });
        }

        return matchesSearch && matchesDate;
    });

    return (
        <Card className="border border-gray-100 shadow-md shadow-gray-100/50 bg-white rounded-2xl overflow-hidden flex flex-col h-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-gray-100 bg-white/50 px-8 py-6 gap-6">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-xl font-bold text-gray-900">הזמנות אחרונות</CardTitle>
                        <Badge variant="secondary" className="rounded-full px-3 py-1 text-sm bg-gray-100 text-gray-700">
                            {filteredBookings.length}
                        </Badge>
                    </div>
                    {filterDate && (
                        <div className="flex items-center gap-2 text-sm text-primary animate-in fade-in slide-in-from-top-1 bg-blue-50 px-3 py-1 rounded-md w-fit">
                            <span>מציג הזמנות ל- {format(filterDate, 'dd/MM/yyyy')}</span>
                            {onClearFilter && (
                                <button
                                    onClick={onClearFilter}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full p-1 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative w-full sm:w-80">
                    <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="חיפוש לפי שם או טלפון..."
                        className="pr-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-all w-full rounded-xl"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="px-8 py-5 text-sm font-semibold text-gray-500 tracking-wider">אורח</th>
                            <th className="px-8 py-5 text-sm font-semibold text-gray-500 tracking-wider">יחידה</th>
                            <th className="px-8 py-5 text-sm font-semibold text-gray-500 tracking-wider">תאריכים</th>
                            <th className="px-8 py-5 text-sm font-semibold text-gray-500 tracking-wider">הרכב</th>
                            <th className="px-8 py-5 text-sm font-semibold text-gray-500 tracking-wider">סטטוס</th>
                            <th className="px-8 py-5 text-sm font-semibold text-gray-500 tracking-wider">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                </td>
                            </tr>
                        ) : filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-8 py-20 text-center text-gray-500">
                                    {filterDate ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-50 rounded-full">
                                                <CalendarOff className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <span className="text-lg">אין הזמנות בתאריך זה</span>
                                            <Button variant="outline" size="sm" onClick={onClearFilter}>נקה סינון</Button>
                                        </div>
                                    ) : (
                                        'לא נמצאו הזמנות'
                                    )}
                                </td>
                            </tr>
                        ) : (
                            filteredBookings.map((booking) => {
                                const checkIn = parseISO(booking.check_in);
                                const checkOut = parseISO(booking.check_out);
                                const nights = differenceInDays(checkOut, checkIn);

                                return (
                                    <tr
                                        key={booking.id}
                                        className="hover:bg-blue-50/30 transition-colors group cursor-pointer border-b border-gray-50 last:border-0"
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shadow-sm">
                                                    {booking.guest_name.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 text-base">{booking.guest_name}</div>
                                                    <div className="text-sm text-gray-500 font-normal mt-0.5">{booking.guest_phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge variant="outline" className={`px-3 py-1 rounded-md text-sm font-medium ${booking.unit_type === 'villa'
                                                ? 'bg-blue-50 text-blue-700 border-blue-100'
                                                : 'bg-green-50 text-green-700 border-green-100'
                                                }`}>
                                                {booking.unit_type === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium text-gray-900 text-sm">{format(checkIn, 'dd/MM')} - {format(checkOut, 'dd/MM')}</span>
                                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded w-fit">{nights} לילות</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-gray-600">
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1.5" title="מבוגרים">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span className="font-medium">{booking.adults || 1}</span>
                                                </div>
                                                {(booking.children > 0) && (
                                                    <div className="flex items-center gap-1.5" title="ילדים">
                                                        <Baby className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium">{booking.children}</span>
                                                    </div>
                                                )}
                                                {(booking.pets > 0) && (
                                                    <div className="flex items-center gap-1.5" title="חיות מחמד">
                                                        <Cat className="h-4 w-4 text-gray-400" />
                                                        <span className="font-medium">{booking.pets}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className={`px-3 py-1 text-sm ${booking.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                                                booking.status === 'declined' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                                    'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                }`}>
                                                {booking.status === 'approved' ? 'מאושר' :
                                                    booking.status === 'declined' ? 'נדחה' : 'ממתין לאישור'}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6" onClick={(e) => e.stopPropagation()}>
                                            {booking.status === 'pending' ? (
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        size="sm"
                                                        className="h-9 w-9 p-0 bg-green-600 hover:bg-green-700 rounded-full shadow-sm hover:shadow-md transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusUpdate(booking, 'approved');
                                                        }}
                                                        isLoading={processingId === booking.id}
                                                        title="אשר הזמנה"
                                                    >
                                                        <Check className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusUpdate(booking, 'declined');
                                                        }}
                                                        isLoading={processingId === booking.id}
                                                        title="דחה הזמנה"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-gray-100" onClick={() => setSelectedBooking(booking)}>
                                                    <MoreVertical className="h-5 w-5 text-gray-400" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {selectedBooking && (
                <BookingModal
                    booking={selectedBooking}
                    isOpen={true}
                    onClose={() => setSelectedBooking(null)}
                    onUpdate={() => {
                        if (onUpdate) onUpdate();
                        else fetchBookings();
                        setSelectedBooking(null);
                    }}
                />
            )}

            {/* IMMEDIATE TRIGGER MODAL */}
            <ActionConfirmModal
                isOpen={!!confirmAction}
                onClose={() => setConfirmAction(null)}
                booking={confirmAction?.booking || null}
                actionType={confirmAction?.type || null}
                title={confirmAction?.title}
            />
        </Card>
    );
}
