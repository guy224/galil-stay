import React, { useState } from 'react';
import type { Booking } from '../../types/supabase';
import { Phone, Wifi, MapPin, ChevronDown, ChevronUp, Clock, Car, Shield, Tv, Zap, Droplets, Wind, Trees, Coffee, AlertTriangle, Star, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface ZimmerGuestPageProps {
    booking: Booking;
}

export default function ZimmerGuestPage({ booking }: ZimmerGuestPageProps) {
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
                        <p><span className="font-semibold text-gray-900">חניה:</span> בקצה הרחוב משמאל, ליד עמוד התאורה.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Shield className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">ביטחון:</span> שימו לב: יש מצלמת אבטחה בכניסה לצרכי ביטחון בלבד.</p>
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
                        <Tv className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">TV & Netflix:</span> שימו לב: השלט השחור לטלוויזיה, השלט הלבן לסטרימר (ערוצי Next/Netflix).</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <CheckCircle className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">תריסים:</span> מתגי התריסים (חצים) נמצאים לצד מתגי התאורה.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Droplets className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">מים חמים:</span> בימים מעוננים: להדליק דוד (מעל השידה בחדר השינה) 20 דקות לפני המקלחת.</p>
                    </div>
                    <div className="flex gap-3 items-start">
                        <Wind className="h-4 w-4 mt-1 text-gray-400" />
                        <p><span className="font-semibold text-gray-900">חשמל:</span> שלטים למזגנים בכל חדר. נא לא להפעיל את כל מכשירי החשמל הכבדים יחד (מזגן+דוד+ג'קוזי).</p>
                    </div>
                </div>
            )
        },
        {
            id: 'jacuzzi',
            title: 'ג\'קוזי',
            icon: <Droplets className="h-5 w-5 text-cyan-500" />,
            content: (
                <div className="space-y-4 text-sm text-gray-600">
                    <p>שליטה על ג'טים וטמפרטורה דרך הלוח בג'קוזי.</p>
                    <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-800 text-xs">
                        <div className="flex items-center gap-2 font-bold mb-1">
                            <AlertTriangle className="h-3 w-3" /> חשוב מאוד:
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                            <li>אין להכניס סבון/שמן למים!</li>
                            <li>חובה לכסות את הג'קוזי בסיום השימוש לשמירה על החום.</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            id: 'nature',
            title: 'טיולים בסביבה',
            icon: <Trees className="h-5 w-5 text-green-600" />,
            content: (
                <div className="space-y-4 text-sm text-gray-600">
                    <div className="border-l-2 border-green-200 pl-3">
                        <p className="font-bold text-gray-900">נחל קורן (הנהר הנעלם)</p>
                        <p className="text-xs mt-1">3 דקות הליכה. פנו ימינה בקצה הרחוב עד מפל הזיכרון. מסלול מוצל וקסום.</p>
                    </div>
                    <div className="border-l-2 border-green-200 pl-3">
                        <p className="font-bold text-gray-900">נחל שניר (החצבאני)</p>
                        <p className="text-xs mt-1">15 דקות הליכה. יציאה דרך "שער 1" (שער צהוב). הליכה על השביל המקביל לגדר.</p>
                    </div>
                    <div className="border-l-2 border-green-200 pl-3">
                        <p className="font-bold text-gray-900">חורשת טל</p>
                        <p className="text-xs mt-1">שמורת טבע ענקית עם בריכות שכשוך (מקורות הדן).</p>
                    </div>
                </div>
            )
        },
        {
            id: 'food',
            title: 'אוכל טוב',
            icon: <Coffee className="h-5 w-5 text-orange-500" />,
            content: (
                <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    <li><span className="font-bold text-gray-900">לה לונה (La Luna):</span> איטלקית בתוך הקיבוץ.</li>
                    <li><span className="font-bold text-gray-900">בקתא:</span> בית קפה (קיבוץ דן).</li>
                    <li><span className="font-bold text-gray-900">כביש 90:</span> המבורגרים מעולים (צומת מחניים).</li>
                    <li><span className="font-bold text-gray-900">לולו:</span> קיבוצטריה/איטלקית (קיבוץ עמיר).</li>
                </ul>
            )
        },
        {
            id: 'rules',
            title: 'נהלים',
            icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
            content: (
                <ul className="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    <li>שקט בשעות הלילה (אזור מגורים).</li>
                    <li>ללא עישון בתוך הבית (מותר בגינה עם מאפרה).</li>
                    <li><span className="font-bold text-gray-900">כלבים:</span> באהבה, אך לא על הריהוט/מיטות. לא להשאיר לבד בבית. חובה לקשור בחוץ.</li>
                </ul>
            )
        }
    ];

    return (
        <div className="bg-white min-h-screen pb-20">
            {/* 1. Hero & Welcome */}
            <div className="relative h-64 bg-gray-900 text-white">
                <img
                    src="https://images.unsplash.com/photo-1510798831971-661eb04b3739?q=80&w=2574&auto=format&fit=crop"
                    alt="Zimmer Nature"
                    className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                    <h1 className="text-2xl font-bold mb-2">ברוכים הבאים לבית של ורד ועמרי! 🌿</h1>
                    <p className="text-sm text-gray-200 leading-relaxed">
                        אנחנו ורד ועמרי, אנשי חינוך ואוהבי טבע, הורים לליבי ולבלה הכלבה. שמחים לארח אתכם בפינת הטבע שלנו.
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

                        {/* Content Animation - Simple check for now */}
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
