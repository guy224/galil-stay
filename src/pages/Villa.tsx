import React from 'react';
import { ArrowRight, Wifi, Sparkles, ChefHat, Users } from 'lucide-react';
import { BookingWidget } from '../components/booking/BookingWidget';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';

export default function VillaPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="relative h-[60vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop")' }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-12 text-white">
                    <Link to="/" className="text-white/80 hover:text-white mb-4 flex items-center gap-2 w-fit">
                        <ArrowRight className="h-4 w-4" /> חזרה לדף הבית
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-bold mb-2">בית גלילי</h1>
                    <p className="text-xl md:text-2xl opacity-90">וילת נופש יוקרתית למשפחות וקבוצות</p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Details Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold mb-6 text-primary">אודות הוילה</h2>
                            <p className="text-lg leading-relaxed text-gray-600 mb-6">
                                וילת "בית גלילי" מציעה חווית אירוח אקסקלוסיבית בלב הטבע.
                                הוילה משתרעת על פני מפלס אחד מרווח ומעוצבת בקפידה עם חשיבה על כל פרט.
                                מתאימה למשפחות המבקשות פרטיות, קבוצות חברים, או אירועים אינטימיים.
                            </p>

                            <h3 className="text-xl font-bold mb-4 mt-8">מה במקום?</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Feature icon={Users} label="עד 12 אורחים" />
                                <Feature icon={ChefHat} label="מטבח שף מאובזר" />
                                <Feature icon={Sparkles} label="בריכה מחוממת" />
                                <Feature icon={Wifi} label="אינטרנט מהיר" />
                            </div>
                        </div>

                        {/* Gallery Placeholder */}
                        <div className="grid grid-cols-2 gap-4">
                            <img src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2071&auto=format&fit=crop" className="rounded-lg h-64 object-cover w-full" alt="Living Room" />
                            <img src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop" className="rounded-lg h-64 object-cover w-full" alt="Pool" />
                        </div>
                    </div>

                    {/* Booking Column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <BookingWidget preselectedUnitType="villa" />
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function Feature({ icon: Icon, label }: { icon: any, label: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg border border-primary/10 text-center">
            <Icon className="h-6 w-6 text-primary mb-2" />
            <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
    );
}
