import React from 'react';
import { BookingList } from '../components/admin/BookingList';

export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">לוח בקרה - גליל סטיי</h1>
                        <p className="text-gray-500">ניהול הזמנות ושירות לאורח</p>
                    </div>
                    {/* <Button variant="outline">יציאה</Button> */}
                </header>

                <main>
                    <BookingList />
                </main>
            </div>
        </div>
    );
}
