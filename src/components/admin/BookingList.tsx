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
        <Card className="border-none shadow-sm bg-white overflow-hidden flex flex-col h-full">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b bg-gray-50/50 px-6 py-4 gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">הזמנות אחרונות</CardTitle>
                        <Badge variant="secondary" className="rounded-full px-2">
                            {filteredBookings.length}
                        </Badge>
                    </div>
                    {filterDate && (
                        <div className="flex items-center gap-2 text-sm text-primary animate-in fade-in slide-in-from-top-1">
                            <span>מציג הזמנות ל- {format(filterDate, 'dd/MM/yyyy')}</span>
                            {onClearFilter && (
                                <button
                                    onClick={onClearFilter}
                                    className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
                                >
                                    נקה סינון
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="חיפוש אורח..."
                        className="pr-9 h-9 bg-white w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b">
                        <tr>
                            <th className="px-6 py-3 font-medium">אורח</th>
                            <th className="px-6 py-3 font-medium">יחידה</th>
                            <th className="px-6 py-3 font-medium">תאריכים</th>
                            <th className="px-6 py-3 font-medium">הרכב</th>
                            <th className="px-6 py-3 font-medium">סטטוס</th>
                            <th className="px-6 py-3 font-medium">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                                </td>
                            </tr>
                        ) : filteredBookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    {filterDate ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <CalendarOff className="h-8 w-8 text-gray-300" />
                                            <span>אין הזמנות בתאריך זה</span>
                                            <Button variant="outline" size="sm" onClick={onClearFilter}>נקה תאריך</Button>
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
                                        className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                        onClick={() => setSelectedBooking(booking)}
                                    >
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {booking.guest_name.slice(0, 2)}
                                                </div>
                                                <div>
                                                    <div>{booking.guest_name}</div>
                                                    <div className="text-xs text-gray-500 font-normal">{booking.guest_phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className={booking.unit_type === 'villa' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-green-50 text-green-700 border-green-200'}>
                                                {booking.unit_type === 'villa' ? 'וילה' : 'צימר'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{format(checkIn, 'dd/MM')} - {format(checkOut, 'dd/MM')}</span>
                                                <span className="text-xs text-gray-500">{nights} לילות</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            <div className="flex items-center gap-3 text-xs">
                                                <div className="flex items-center gap-1" title="מבוגרים">
                                                    <User className="h-3 w-3" /> {booking.adults || 1}
                                                </div>
                                                {(booking.children > 0) && (
                                                    <div className="flex items-center gap-1" title="ילדים">
                                                        <Baby className="h-3 w-3" /> {booking.children}
                                                    </div>
                                                )}
                                                {(booking.pets > 0) && (
                                                    <div className="flex items-center gap-1" title="חיות מחמד">
                                                        <Cat className="h-3 w-3" /> {booking.pets}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={
                                                booking.status === 'approved' ? 'success' :
                                                    booking.status === 'declined' ? 'destructive' : 'warning'
                                            }>
                                                {booking.status === 'approved' ? 'מאושר' :
                                                    booking.status === 'declined' ? 'נדחה' : 'ממתין'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            {booking.status === 'pending' ? (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700 rounded-full"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusUpdate(booking, 'approved');
                                                        }}
                                                        isLoading={processingId === booking.id}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 rounded-full"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleStatusUpdate(booking, 'declined');
                                                        }}
                                                        isLoading={processingId === booking.id}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelectedBooking(booking)}>
                                                    <MoreVertical className="h-4 w-4 text-gray-400" />
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
                        // We intentionally DON'T reset selectedBooking here if we want to show a toast,
                        // but for the Modal flow we might just want to close it or keep it open.
                        // However, the action modal below handles the post-action flow.
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
