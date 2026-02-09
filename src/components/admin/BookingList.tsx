import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Loader2, Search, Coffee, Broom, Inbox } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Booking } from '../../types/supabase';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { BookingModal } from './BookingModal';

export function BookingList() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [search, setSearch] = useState('');

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

    useEffect(() => {
        fetchBookings();
    }, []);

    const filteredBookings = bookings.filter(b =>
        b.guest_name.includes(search) ||
        b.guest_phone.includes(search)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    ניהול הזמנות
                    <span className="text-sm font-normal text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full">
                        {filteredBookings.length}
                    </span>
                </h2>
                <div className="relative w-full sm:w-64">
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="חיפוש לפי שם או טלפון..."
                        className="pr-9 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-3">
                    {filteredBookings.map((booking) => (
                        <Card
                            key={booking.id}
                            className="hover:shadow-md transition-all cursor-pointer bg-white border-transparent hover:border-primary/20 active:scale-[0.99]"
                            onClick={() => setSelectedBooking(booking)}
                            role="button"
                            tabIndex={0}
                        >
                            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                                {/* Right Side: Guest Info */}
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0
                    ${booking.unit_type === 'villa' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}
                  `}>
                                        {booking.unit_type === 'villa' ? 'V' : 'Z'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-lg truncate">{booking.guest_name}</h3>
                                        <p className="text-sm text-gray-500 font-medium">
                                            {format(new Date(booking.check_in), 'dd/MM/yyyy')} — {format(new Date(booking.check_out), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                </div>

                                {/* Middle: Badges (Flex wrap for mobile) */}
                                <div className="flex items-center gap-2 self-start sm:self-center">
                                    {booking.breakfast_ordered && (
                                        <Badge variant={booking.breakfast_status === 'approved' ? 'success' : 'warning'}>
                                            <Coffee className="h-3 w-3 mr-1" />
                                            {booking.breakfast_status === 'approved' ? 'אושר' : 'ממתין'}
                                        </Badge>
                                    )}
                                    {booking.is_clean ? (
                                        <Badge variant="success" className="bg-green-100 text-green-700 hover:bg-green-200">
                                            <Broom className="h-3 w-3 mr-1" />
                                            נקי
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="text-gray-400 border-gray-200 hidden sm:inline-flex">
                                            <Broom className="h-3 w-3 mr-1" />
                                            לא נקי
                                        </Badge>
                                    )}
                                </div>

                                {/* Left: Status */}
                                <div className="self-end sm:self-center">
                                    <Badge className="text-sm px-3 py-1" variant={booking.status === 'approved' ? 'default' : 'warning'}>
                                        {booking.status === 'approved' ? 'מאושר' : 'ממתין'}
                                    </Badge>
                                </div>

                            </CardContent>
                        </Card>
                    ))}

                    {filteredBookings.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Inbox className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">אין הזמנות כרגע</h3>
                            <p className="text-gray-500">נסה לשנות את הסינון או המתן להזמנות חדשות.</p>
                        </div>
                    )}
                </div>
            )}

            {selectedBooking && (
                <BookingModal
                    booking={selectedBooking}
                    isOpen={true}
                    onClose={() => setSelectedBooking(null)}
                    onUpdate={() => {
                        fetchBookings();
                        setSelectedBooking(null);
                    }}
                />
            )}
        </div>
    );
}
