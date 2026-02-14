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

        try {
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
        } catch (e) {
            console.error('Unexpected error fetching data:', e);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data: Booking[]) => {
        try {
            const now = new Date();
            const currentMonthBookings = data.filter(b =>
                b.check_in && isSameMonth(parseISO(b.check_in), now) && b.status === 'approved'
            );

            const monthlyRevenue = currentMonthBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

            const pending = data.filter(b => b.status === 'pending').length;

            // Find next check-in
            const futureBookings = data
                .filter(b => b.status === 'approved' && b.check_in && isAfter(parseISO(b.check_in), startOfDay(now)))
                .sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());

            const nextCheckIn = futureBookings[0] || null;

            // Simple occupancy (days booked / days in month) - Approximation
            const daysInMonth = 30; // avg
            const bookedDays = currentMonthBookings.reduce((sum, b) => {
                if (!b.check_in || !b.check_out) return sum;
                return sum + differenceInDays(parseISO(b.check_out), parseISO(b.check_in));
            }, 0);
            const occupancyRate = Math.min(Math.round((bookedDays / (daysInMonth * 2)) * 100), 100); // *2 for 2 units

            setStats({
                monthlyRevenue,
                occupancyRate,
                pendingBookings: pending,
                nextCheckIn
            });
        } catch (error) {
            console.error('Error calculating dashboard stats:', error);
        }
    };

    const handleNewBookingCreate = async (bookingData: any) => {
        // Optimistic update or just refetch
        await fetchDashboardData();
        // The modal closes itself, but we can verify success here
    };

    return (
        <div className="max-w-[1600px] mx-auto p-8 space-y-10" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                        לוח בקרה
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">סקירה כללית של הפעילות</p>
                </div>
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-xl"
                        onClick={() => navigate('/admin/settings')}
                        title="הגדרות ומחירים"
                    >
                        <Settings className="h-6 w-6" />
                    </Button>
                    <Button onClick={() => setIsNewBookingModalOpen(true)} className="h-12 px-6 text-lg w-full sm:w-auto shadow-lg shadow-blue-100 hover:shadow-xl transition-all rounded-xl">
                        <Calendar className="ml-2 h-5 w-5" />
                        הזמנה חדשה
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <CardTitle className="text-base font-medium text-gray-500">הכנסות החודש</CardTitle>
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="text-4xl font-bold text-gray-900">₪{stats.monthlyRevenue.toLocaleString()}</div>
                        <p className="text-sm text-green-600 mt-2 flex items-center font-medium bg-green-50 w-fit px-2 py-1 rounded-full">
                            <TrendingUp className="h-3 w-3 ml-1" />
                            +12% מחודש שעבר
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <CardTitle className="text-base font-medium text-gray-500">תפוסה חודשית</CardTitle>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="text-4xl font-bold text-gray-900">{stats.occupancyRate}%</div>
                        <div className="w-full bg-gray-100 rounded-full h-2 mt-4">
                            <div className="bg-purple-600 h-2 rounded-full transition-all duration-1000" style={{ width: `${stats.occupancyRate}%` }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <CardTitle className="text-base font-medium text-gray-500">הזמנות ממתינות</CardTitle>
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        <div className="text-4xl font-bold text-gray-900">{stats.pendingBookings}</div>
                        <p className="text-sm text-orange-600 mt-2 font-medium bg-orange-50 w-fit px-2 py-1 rounded-full">
                            דורש טיפול מיידי
                        </p>
                    </CardContent>
                </Card>

                <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-6">
                        <CardTitle className="text-base font-medium text-gray-500">צ'ק-אין קרוב</CardTitle>
                        <div className="p-2 bg-green-50 rounded-lg">
                            <Clock className="h-5 w-5 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 pt-2">
                        {stats.nextCheckIn ? (
                            <>
                                <div className="text-2xl font-bold text-gray-900 truncate">{stats.nextCheckIn.guest_name}</div>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                        {format(parseISO(stats.nextCheckIn.check_in), 'dd/MM')}
                                    </span>
                                    <span className={`text-sm px-2 py-1 rounded-md ${stats.nextCheckIn.unit_type === 'villa' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                        {stats.nextCheckIn.unit_type === 'villa' ? 'וילה' : 'צימר'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="text-xl text-gray-400 font-medium">אין צ'ק-אין קרוב</div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
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
                <div className="space-y-8 flex flex-col h-full">
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
