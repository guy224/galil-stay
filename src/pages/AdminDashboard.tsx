import React, { useEffect, useState } from 'react';
import { format, isSameMonth, parseISO, isAfter, differenceInDays, startOfDay } from 'date-fns';
import { CreditCard, Calendar, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { BookingList } from '../components/admin/BookingList';
import { supabase } from '../lib/supabase';
import { Booking } from '../types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function AdminDashboard() {
    const [bookings, setBookings] = useState<Booking[]>([]);

    // Fetch Bookings
    const fetchBookings = async () => {
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) console.error('Error fetching bookings:', error);
        else setBookings(data as Booking[]);
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    // --- KPI Calculations ---
    const now = new Date();
    const currentMonthBookings = bookings.filter(b =>
        b.status === 'approved' && isSameMonth(parseISO(b.check_in), now)
    );

    // 1. Revenue (This Month)
    const revenue = currentMonthBookings.reduce((sum, b) => sum + b.total_price, 0);

    // 2. Occupancy (This Month) - Simplified approximation
    const totalDaysInMonth = 30; // Approximation
    const occupiedDays = currentMonthBookings.reduce((days, b) => {
        return days + differenceInDays(parseISO(b.check_out), parseISO(b.check_in));
    }, 0);
    const occupancyRate = Math.min(100, Math.round((occupiedDays / totalDaysInMonth) * 100));

    // 3. Pending Requests
    const pendingRequests = bookings.filter(b => b.status === 'pending').length;

    // 4. Next Arrival
    const nextArrival = bookings
        .filter(b => b.status === 'approved' && isAfter(parseISO(b.check_in), startOfDay(now)))
        .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime())[0];

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10" dir="rtl">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">לוח בקרה</h1>
                        <p className="text-gray-500 mt-1">סקירה כללית וניהול שוטף</p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={fetchBookings}>
                            רענון נתונים
                        </Button>
                        <Button>
                            + הזמנה חדשה
                        </Button>
                    </div>
                </header>

                {/* KPI Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Revenue */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">הכנסות (החודש)</CardTitle>
                            <CreditCard className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">₪{revenue.toLocaleString()}</div>
                            <p className="text-xs text-gray-400 mt-1">+12% מהחודש שעבר</p>
                        </CardContent>
                    </Card>

                    {/* Occupancy */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">תפוסה (החודש)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{occupancyRate}%</div>
                            <p className="text-xs text-gray-400 mt-1">{occupiedDays} לילות הוזמנו</p>
                        </CardContent>
                    </Card>

                    {/* Pending Requests */}
                    <Card className={`border-none shadow-sm ${pendingRequests > 0 ? 'bg-orange-50 ring-1 ring-orange-200' : 'bg-white'}`}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">בקשות ממתינות</CardTitle>
                            <AlertCircle className={`h-4 w-4 ${pendingRequests > 0 ? 'text-orange-600' : 'text-gray-400'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${pendingRequests > 0 ? 'text-orange-700' : ''}`}>{pendingRequests}</div>
                            <p className="text-xs text-gray-400 mt-1">דורש טיפול מיידי</p>
                        </CardContent>
                    </Card>

                    {/* Next Arrival */}
                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-gray-500">הגעה קרובה</CardTitle>
                            <Clock className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            {nextArrival ? (
                                <>
                                    <div className="text-lg font-bold truncate">{nextArrival.guest_name}</div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {format(parseISO(nextArrival.check_in), 'dd/MM')} - {nextArrival.unit_type === 'villa' ? 'וילה' : 'צימר'}
                                    </p>
                                </>
                            ) : (
                                <div className="text-sm text-gray-400">אין הגעות קרובות</div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Recent Bookings Table (Takes up 2 columns) */}
                    <div className="lg:col-span-2 space-y-6">
                        <BookingList initialBookings={bookings} onUpdate={fetchBookings} />
                    </div>

                    {/* Calendar Placeholder (Takes up 1 column for now) */}
                    <div className="space-y-6">
                        <Card className="h-full min-h-[400px] border-dashed border-2 bg-gray-50/50 flex items-center justify-center">
                            <div className="text-center p-6">
                                <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">לוח שנה (בקרוב)</h3>
                                <p className="text-sm text-gray-500 mt-2">
                                    כאן יוצג לוח השנה המלא עם אפשרות לגרירה ושינוי תאריכים.
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
