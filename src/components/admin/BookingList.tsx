import React, { useEffect, useState } from 'react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { Loader2, Search, Coffee, Sparkles, Inbox, MoreVertical, Check, X, User, Baby, Cat } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Booking } from '../../types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { BookingModal } from './BookingModal';

interface BookingListProps {
    initialBookings?: Booking[];
    onUpdate?: () => void | Promise<void>;
}

export function BookingList({ initialBookings, onUpdate }: BookingListProps) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings || []);
    const [loading, setLoading] = useState(!initialBookings);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [search, setSearch] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

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

    const handleStatusUpdate = async (id: string, newStatus: 'approved' | 'declined') => {
        setProcessingId(id);
        const { error } = await supabase
            .from('bookings')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating status:', error);
            alert('שגיאה בעדכון הסטטוס');
        } else {
            if (onUpdate) await onUpdate();
            else fetchBookings();
        }
        setProcessingId(null);
    };

    const filteredBookings = bookings.filter(b =>
        b.guest_name.includes(search) ||
        b.guest_phone.includes(search)
    );

    return (
        <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-gray-50/50 px-6 py-4">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">הזמנות אחרונות</CardTitle>
                    <Badge variant="secondary" className="rounded-full px-2">
                        {filteredBookings.length}
                    </Badge>
                </div>
                <div className="relative w-64">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="חיפוש אורח..."
                        className="pr-9 h-9 bg-white"
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
                                    לא נמצאו הזמנות
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
                                                        onClick={() => handleStatusUpdate(booking.id, 'approved')}
                                                        isLoading={processingId === booking.id}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 rounded-full"
                                                        onClick={() => handleStatusUpdate(booking.id, 'declined')}
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
                        setSelectedBooking(null);
                    }}
                />
            )}
        </Card>
    );
}
