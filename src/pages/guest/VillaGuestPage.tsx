import React, { useState } from 'react';
import type { Booking } from '../../types/supabase';
import { Phone, Wifi, MapPin, ChevronDown, ChevronUp, Clock, Car, Shield, Tv, Zap, Droplets, Wind, Trees, Coffee, AlertTriangle, Star, CheckCircle, Dog, Utensils } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface VillaGuestPageProps {
    booking: Booking;
}

export default function VillaGuestPage({ booking }: VillaGuestPageProps) {
    // Accordion State
    const [openSection, setOpenSection] = useState<string | null>(null);

    const toggleSection = (id: string) => {
        setOpenSection(openSection === id ? null : id);
    };

    const sections = [
        {
            id: 'arrival',
            title: 'הגעה ועזיבה',
            icon: <Clock className="h-5 w-5 text-blue-500" />,
            content: (
                <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg">
                        <div>
                            <span className="font-bold block text-blue-900">Check-in</span>
                            <span>15:00</span>
                        </div>
                        <div className="h-8 w-px bg-blue-200 mx-2"></div>
                        <div>
                            <span className="font-bold block text-blue-900">Check-out</span>
                            <span>11:00</span>
                        </div>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Car className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">חניה:</span> חניה ברחוב ליד הבית.</p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => window.open(`https://wa.me/972526121210?text=היי, אפשר לבקש צק-אאוט מאוחר?`, '_blank')}>
                        בקש צ'ק-אאוט מאוחר
                    </Button>
                </div>
            )
        },
        {
            id: 'house',
            title: 'תפעול הבית',
            icon: <Zap className="h-5 w-5 text-yellow-500" />,
            content: (
                <div className="space-y-4 text-sm text-gray-600">
                    <div className="flex gap-3 items-start">
                        <Droplets className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">מים חמים:</span> בימים מעוננים: להדליק את הדוד כ-20 דקות לפני המקלחת. המתג נמצא בחדר הארונות (בחדר השינה המרכזי).</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Wind className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">מיזוג:</span> שלטים למזגן ולמאוורר בכל חדר.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Tv className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">TV:</span> טלוויזיה חכמה עם Netflix ו-Next.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <CheckCircle className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">תריסים:</span> כפתורי שליטה (חצים) לצד מתגי התאורה.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Utensils className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">בישול:</span> נא לפתוח חלון באוורור בזמן טיגן/בישול.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'rules',
            title: 'נהלים וחיות מחמד',
            icon: <Shield className="h-5 w-5 text-red-500" />,
            content: (
                <div className="space-y-4 text-sm text-gray-600">
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                        <div className="flex items-center gap-2 font-bold mb-2 text-orange-800">
                            <Dog className="h-4 w-4" /> חיות מחמד
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-orange-900">
                            <li>מותרים באהבה (בתיאום מראש).</li>
                            <li>אין לעלות על ספות/מיטות.</li>
                            <li>חובה לקשור ברצועה מחוץ לבית.</li>
                            <li>אין להשאיר כלב לבד בבית.</li>
                            <li className="text-xs mt-1 font-medium">* קיים חיוב של 50 ש"ח לכלב (דמי ניקיון).</li>
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <p><span className="font-semibold text-gray-900">רעש:</span> נא לשמור על השקט (יישוב מגורים), במיוחד בלילה.</p>
                        <p><span className="font-semibold text-gray-900">בטיחות:</span> לוודא שהבית נעול והמזגנים כבויים ביציאה.</p>
                    </div>
                </div>
            )
        },
        {
            id: 'nature',
            title: 'טיולים ואוכל',
            icon: <Trees className="h-5 w-5 text-green-600" />,
            content: (
                <div className="space-y-4 text-sm text-gray-600">
                    <div className="space-y-3">
                        <div className="border-l-2 border-green-200 pl-3">
                            <p className="font-bold text-gray-900">נחל קורן</p>
                            <p className="text-xs mt-1">3 דקות הליכה (פנו ימינה בקצה הרחוב).</p>
                        </div>
                        <div className="border-l-2 border-green-200 pl-3">
                            <p className="font-bold text-gray-900">נחל שניר</p>
                            <p className="text-xs mt-1">15 דקות הליכה (דרך השער הצהוב).</p>
                        </div>
                        <div className="border-l-2 border-green-200 pl-3">
                            <p className="font-bold text-gray-900">חורשת טל</p>
                            <p className="text-xs mt-1">שמורת טבע עם בריכות מים קרים.</p>
                        </div>
                    </div>

                    <div className="pt-2 border-t mt-2">
                        <div className="flex items-center gap-2 font-bold mb-2 text-gray-900">
                            <Coffee className="h-4 w-4 text-orange-500" /> המלצות אוכל
                        </div>
                        <p className="text-xs">לה לונה, בקתא, כביש 90, לולו.</p>
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* 1. Hero & Welcome */}
            <div className="relative h-64 bg-gray-900 text-white">
                <img
                    src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2670&auto=format&fit=crop"
                    alt="Villa Outdoor"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h1 className="text-2xl font-bold mb-2">ברוכים הבאים לוילה בין הנחלים! 🌿</h1>
                    <p className="text-sm text-gray-200 leading-relaxed">
                        הבית שלנו משתלב בהרמוניה עם הטבע, מול נוף עמק החולה והחרמון.
                    </p>
                </div>
            </div>

            {/* 2. Quick Actions (Sticky) */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur shadow-sm border-b p-4 flex justify-around items-center text-xs font-medium text-gray-600">
                <a href="https://waze.com/ul/hsvc4g285f" target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors">
                    <div className="bg-blue-50 p-2 rounded-full text-blue-600">
                        <MapPin className="h-5 w-5" />
                    </div>
                    Waze
                </a>
                <button
                    onClick={() => {
                        navigator.clipboard.writeText('0526121210');
                        alert('סיסמת ה-WiFi הועתקה!');
                    }}
                    className="flex flex-col items-center gap-1 hover:text-green-600 transition-colors"
                >
                    <div className="bg-green-50 p-2 rounded-full text-green-600">
                        <Wifi className="h-5 w-5" />
                    </div>
                    WiFi: VERED
                </button>
                <a href="tel:+972526121210" className="flex flex-col items-center gap-1 hover:text-purple-600 transition-colors">
                    <div className="bg-purple-50 p-2 rounded-full text-purple-600">
                        <Phone className="h-5 w-5" />
                    </div>
                    חייג לורד
                </a>
            </div>

            {/* 3. The Information Accordian */}
            <div className="p-4 space-y-3 max-w-md mx-auto">
                {sections.map(section => (
                    <div key={section.id} className="border rounded-xl overflow-hidden shadow-sm bg-white">
                        <button
                            onClick={() => toggleSection(section.id)}
                            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                {section.icon}
                                <span className="font-bold text-gray-900">{section.title}</span>
                            </div>
                            {openSection === section.id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                        </button>

                        {/* Content Animation */}
                        {openSection === section.id && (
                            <div className="p-4 pt-0 bg-white animate-in slide-in-from-top-2 duration-200">
                                <hr className="border-gray-100 my-3" />
                                {section.content}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* 4. Footer */}
            <div className="p-6 text-center text-gray-500 text-sm pb-10">
                <p>נהניתם? נשמח לדירוג 5 כוכבים!</p>
                <div className="flex justify-center gap-1 mt-2 text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                </div>
            </div>
        </div>
    );
}
