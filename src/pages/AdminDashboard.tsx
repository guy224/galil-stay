import React, { useEffect, useState } from 'react';
import { format, isSameMonth, parseISO, isAfter, differenceInDays, startOfDay } from 'date-fns';
import { CreditCard, Calendar, Clock, TrendingUp, AlertCircle, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookingList } from '../components/admin/BookingList';
import { DashboardCalendar } from '../components/admin/DashboardCalendar';
import { DailyActions } from '../components/admin/DailyActions';
import { NewBookingModal } from '../components/admin/NewBookingModal';
import { ActionConfirmModal } from '../components/admin/ActionConfirmModal';
import type { MessageType } from '../utils/whatsappUtils';
import { supabase } from '../lib/supabase';
import type { Booking } from '../types/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export default function AdminDashboard() {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        monthlyRevenue: 0,
        occupancyRate: 0,
        pendingBookings: 0,
        nextCheckIn: null as Booking | null
    });

    // Calendar Filter State
    const [filterDate, setFilterDate] = useState<Date | null>(null);

    // New Booking Modal State
    const [isNewBookingModalOpen, setIsNewBookingModalOpen] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);

        const { data: bookingsData, error } = await supabase
            .from('bookings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
            return;
        }

        const allBookings = bookingsData as Booking[];
        setBookings(allBookings);
        calculateStats(allBookings);
        setLoading(false);
    };

    const calculateStats = (data: Booking[]) => {
        const now = new Date();
        const currentMonthBookings = data.filter(b =>
            isSameMonth(parseISO(b.check_in), now) && b.status === 'approved'
        );

        const monthlyRevenue = currentMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

        const pending = data.filter(b => b.status === 'pending').length;

        // Find next check-in
        const futureBookings = data
            .filter(b => b.status === 'approved' && isAfter(parseISO(b.check_in), startOfDay(now)))
            .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());

        const nextCheckIn = futureBookings[0] || null;

        // Simple occupancy (days booked / days in month) - Approximation
        const daysInMonth = 30; // avg
        const bookedDays = currentMonthBookings.reduce((sum, b) => {
            return sum + differenceInDays(parseISO(b.check_out), parseISO(b.check_in));
        }, 0);
        const occupancyRate = Math.min(Math.round((bookedDays / (daysInMonth * 2)) * 100), 100); // *2 for 2 units

        setStats({
            monthlyRevenue,
            occupancyRate,
            pendingBookings: pending,
            nextCheckIn
        });
    };

    const handleNewBookingCreate = async (bookingData: any) => {
        // Optimistic update or just refetch
        await fetchDashboardData();
        // The modal closes itself, but we can verify success here
    };

    return (
        <div className="space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                        לוח בקרה
                    </h1>
                    <p className="text-gray-500 mt-1">סקירה כללית של הפעילות</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => navigate('/admin/settings')}
                        title="הגדרות ומחירים"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                    <Button onClick={() => setIsNewBookingModalOpen(true)} className="w-full sm:w-auto shadow-md hover:shadow-lg transition-all">
                        <Calendar className="ml-2 h-4 w-4" />
                        הזמנה חדשה
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-900">הכנסות החודש</CardTitle>
                        <CreditCard className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">₪{stats.monthlyRevenue.toLocaleString()}</div>
                        <p className="text-xs text-blue-600/80 mt-1 flex items-center">
                            <TrendingUp className="h-3 w-3 ml-1" />
                            +12% מחודש שעבר
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-purple-900">תפוסה חודשית</CardTitle>
                        <Calendar className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-700">{stats.occupancyRate}%</div>
                        <div className="w-full bg-purple-100 rounded-full h-1.5 mt-2">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${stats.occupancyRate}%` }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-900">הזמנות ממתינות</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{stats.pendingBookings}</div>
                        <p className="text-xs text-orange-600/80 mt-1">דורש טיפול</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-900">צ'ק-אין קרוב</CardTitle>
                        <Clock className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        {stats.nextCheckIn ? (
                            <>
                                <div className="text-lg font-bold text-green-700 truncate">{stats.nextCheckIn.guest_name}</div>
                                <p className="text-xs text-green-600/80 mt-1">
                                    {format(parseISO(stats.nextCheckIn.check_in), 'dd/MM')} - {stats.nextCheckIn.unit_type === 'villa' ? 'וילה' : 'צימר'}
                                </p>
                            </>
                        ) : (
                            <div className="text-sm text-green-600/80">אין צ'ק-אין קרוב</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                {/* Main Content - Booking List */}
                <div className="lg:col-span-2 h-full min-h-[500px]">
                    <BookingList
                        initialBookings={bookings}
                        onUpdate={fetchDashboardData}
                        filterDate={filterDate}
                        onClearFilter={() => setFilterDate(null)}
                    />
                </div>

                {/* Sidebar - Actions & Calendar */}
                <div className="space-y-6 flex flex-col h-full">
                    <DailyActions bookings={bookings} onUpdate={fetchDashboardData} />

                    <div className="sticky top-6">
                        <DashboardCalendar
                            bookings={bookings}
                            selectedDate={filterDate}
                            onSelectDate={setFilterDate}
                        />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <NewBookingModal
                isOpen={isNewBookingModalOpen}
                onClose={() => setIsNewBookingModalOpen(false)}
                onCreate={handleNewBookingCreate}
            />
        </div>
    );
}
