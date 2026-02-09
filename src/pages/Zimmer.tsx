import React from 'react';
import { ArrowRight, Wifi, Droplets, PawPrint, Coffee } from 'lucide-react';
import { BookingWidget } from '../components/booking/BookingWidget';
import { Link } from 'react-router-dom';

export default function ZimmerPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero */}
            <div className="relative h-[60vh] overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=2070&auto=format&fit=crop")' }}
                >
                    <div className="absolute inset-0 bg-black/40" />
                </div>
                <div className="relative h-full container mx-auto px-4 flex flex-col justify-end pb-12 text-white">
                    <Link to="/" className="text-white/80 hover:text-white mb-4 flex items-center gap-2 w-fit">
                        <ArrowRight className="h-4 w-4" /> חזרה לדף הבית
                    </Link>
                    <h1 className="text-5xl md:text-7xl font-bold mb-2">בין הנחלים</h1>
                    <p className="text-xl md:text-2xl opacity-90">צימר רומנטי בלב הטבע</p>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Details Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white rounded-xl p-8 shadow-sm">
                            <h2 className="text-2xl font-bold mb-6 text-primary">אודות הצימר</h2>
                            <p className="text-lg leading-relaxed text-gray-600 mb-6">
                                בקתת עץ מבודדת וקסומה, השוכנת בין עצי האלון לבין הנחל הזורם.
                                המקום המושלם לזוגות המחפשים שקט, פרטיות וחיבור לטבע.
                                עיצוב כפרי חם בשילוב פינוקים מודרניים.
                            </p>

                            <h3 className="text-xl font-bold mb-4 mt-8">מה במקום?</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Feature icon={Droplets} label="ג'קוזי ספא פרטי" />
                                <Feature icon={PawPrint} label="ידידותי לחיות מחמד" />
                                <Feature icon={Coffee} label="מכונת קפה איכותית" />
                                <Feature icon={Wifi} label="אינטרנט אלחוטי" />
                            </div>
                        </div>

                        {/* Gallery Placeholder */}
                        <div className="grid grid-cols-2 gap-4">
                            <img src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=2070&auto=format&fit=crop" className="rounded-lg h-64 object-cover w-full" alt="Jacuzzi" />
                            <img src="https://images.unsplash.com/photo-1522771753037-6333d797dc77?q=80&w=2069&auto=format&fit=crop" className="rounded-lg h-64 object-cover w-full" alt="Bedroom" />
                        </div>
                    </div>

                    {/* Booking Column */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <BookingWidget unitType="zimmer" basePrice={1200} />
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
