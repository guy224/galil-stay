import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isAfter, isBefore, startOfDay, addHours } from 'date-fns';
import {
    MapPin, Wifi, Key, BookOpen,
    Coffee, Utensils, Mountain,
    MessageCircle, Clock, HelpCircle,
    Lock, Check, Copy, Navigation,
    ChevronLeft, Star
} from 'lucide-react';
import { Button } from '../ui/Button';
import type { Booking } from '../../types/supabase';
import { useToast } from '../ui/Toast';
import { generateWhatsAppLink } from '../../utils/whatsappUtils';

interface GuestLandingPageProps {
    booking: Booking;
}

export default function GuestLandingPage({ booking }: GuestLandingPageProps) {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('home');
    const [stayPhase, setStayPhase] = useState<'FUTURE' | 'PRESENT' | 'PAST'>('FUTURE');

    // Derived Data
    const firstName = booking.guest_name.split(' ')[0];
    const unitName = booking.unit_type === 'villa' ? 'וילה בגליל' : 'צימר בין הנחלים';
    const bgImage = booking.unit_type === 'villa'
        ? 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop'
        : 'https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=2070&auto=format&fit=crop';

    // Simulate initial loading
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1500);

        // Calculate Phase
        const now = new Date();
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);

        // Add check-in time (e.g., 15:00) logic if needed, comparing dates strictly for now
        if (isBefore(now, startOfDay(checkIn))) {
            setStayPhase('FUTURE');
        } else if (isAfter(now, startOfDay(checkOut))) {
            setStayPhase('PAST');
        } else {
            setStayPhase('PRESENT');
        }

        return () => clearTimeout(timer);
    }, [booking]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 50 }
        }
    };

    const handleCopyWifi = () => {
        navigator.clipboard.writeText('GalilFreeWifi2025');
        addToast('הסיסמה הועתקה ללוח!', 'success');
    };

    const handleWaze = () => {
        window.open('https://waze.com/ul/hsv8k42qq1', '_blank'); // Placeholder coords
    };

    const handleWhatsApp = (text: string) => {
        const link = `https://wa.me/972501234567?text=${encodeURIComponent(text)}`;
        window.open(link, '_blank');
    };

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="min-h-screen bg-gray-50 text-slate-800 font-sans relative overflow-hidden" dir="rtl">
            {/* Ambient Background */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center"
                style={{ backgroundImage: `url("${bgImage}")` }}
            />
            <div className="fixed inset-0 z-0 bg-gradient-to-b from-black/40 via-black/20 to-slate-900/90 backdrop-blur-[2px]" />

            <motion.div
                className="relative z-10 max-w-md mx-auto px-6 py-10 pb-32 min-h-screen flex flex-col"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="mb-10 text-white mt-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-sm font-medium mb-3"
                    >
                        {stayPhase === 'FUTURE' ? 'ניפגש בקרוב 👋' : stayPhase === 'PRESENT' ? 'חופשה נעימה ☀️' : 'תודה שהתארחתם 🙏'}
                    </motion.div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2 shadow-sm">
                        ברוכים הבאים, {firstName}!
                    </h1>
                    <p className="text-lg text-white/80 font-light">
                        החופשה שלכם ב<span className="font-medium text-white">{unitName}</span> מתחילה כאן.
                    </p>
                </motion.div>

                {/* Control Grid */}
                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-8">
                    {/* Waze */}
                    <ControlCard
                        icon={Navigation}
                        label="נווט לצימר"
                        onClick={handleWaze}
                        delay={0.1}
                    />

                    {/* WiFi */}
                    <ControlCard
                        icon={Wifi}
                        label="התחבר לאינטרנט"
                        onClick={handleCopyWifi}
                        delay={0.2}
                    />

                    {/* Door Code */}
                    <DoorCodeCard
                        code={booking.gate_code || '1234'} // Fallback if empty
                        isLocked={stayPhase === 'FUTURE'}
                        delay={0.3}
                    />

                    {/* House Guide */}
                    <ControlCard
                        icon={BookOpen}
                        label="מדריך הבית"
                        onClick={() => addToast('המדריך יעלה לאוויר בקרוב!', 'info')}
                        delay={0.4}
                    />
                </motion.div>

                {/* VIP Service */}
                <motion.div variants={itemVariants} className="mb-8">
                    <h3 className="text-white/90 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        שירות VIP לאורח
                    </h3>
                    <div className="space-y-3">
                        <WhatsAppButton
                            label="ארוחת בוקר"
                            sub="תפריט והזמנה"
                            emoji="🍳"
                            onClick={() => handleWhatsApp(`היי ${firstName}, אשמח לקבל תפריט ארוחת בוקר!`)}
                        />
                        <WhatsAppButton
                            label="תיאום צ'ק אאוט"
                            sub="מתי מפנים?"
                            emoji="⏳"
                            onClick={() => handleWhatsApp(`היי, רציתי לשאול לגבי שעת הצ'ק אאוט.`)}
                        />
                        <WhatsAppButton
                            label="יש לי שאלה"
                            sub="אנחנו כאן לכל דבר"
                            emoji="💬"
                            onClick={() => handleWhatsApp(`היי, יש לי שאלה לגבי השהות...`)}
                        />
                    </div>
                </motion.div>

                {/* Recommendations Carousel */}
                <motion.div variants={itemVariants} className="mb-4">
                    <h3 className="text-white/90 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <MapPin className="h-4 w-4 text-green-400" />
                        ההמלצות שלנו
                    </h3>
                    <div className="flex overflow-x-auto pb-4 gap-4 -mx-6 px-6 no-scrollbar snap-x">
                        <RecommendationCard
                            title="קפה של בוקר"
                            image="https://images.unsplash.com/photo-1497935586351-b67a49e012bf?q=80&w=2071&auto=format&fit=crop"
                            tag="בית קפה"
                        />
                        <RecommendationCard
                            title="המעיין הסודי"
                            image="https://images.unsplash.com/photo-1533228876829-65c94e7b5025?q=80&w=2070&auto=format&fit=crop"
                            tag="טבע"
                        />
                        <RecommendationCard
                            title="רוטנברג"
                            image="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1974&auto=format&fit=crop"
                            tag="מסעדה"
                        />
                    </div>
                </motion.div>

                <div className="text-center text-white/40 text-xs mt-auto">
                    © Galil Stay Experience
                </div>
            </motion.div>
        </div>
    );
}

// --- Sub-Components ---

function ControlCard({ icon: Icon, label, onClick, delay }: any) {
    return (
        <motion.button
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="bg-white/90 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-3 h-32 relative overflow-hidden group"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="p-3 bg-blue-50/80 rounded-full text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Icon className="h-6 w-6" />
            </div>
            <span className="font-bold text-slate-700 text-sm group-hover:text-slate-900">{label}</span>
        </motion.button>
    );
}

function DoorCodeCard({ code, isLocked, delay }: { code: string, isLocked: boolean, delay: number }) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className={`
                bg-white/90 backdrop-blur-xl border border-white/40 p-5 rounded-2xl shadow-lg 
                flex flex-col items-center justify-center gap-2 h-32 relative overflow-hidden
                ${isLocked ? 'grayscale-[0.5]' : ''}
            `}
        >
            <div className="flex flex-col items-center gap-3 z-10">
                <div className={`p-3 rounded-full transition-colors duration-300 ${isLocked ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                    {isLocked ? <Lock className="h-6 w-6" /> : <Key className="h-6 w-6" />}
                </div>

                <div className="text-center">
                    <span className="text-xs text-gray-500 font-medium block mb-1">קוד לכניסה</span>
                    <AnimatePresence mode="wait">
                        {isLocked ? (
                            <motion.div
                                key="locked"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="font-mono text-2xl font-bold tracking-widest text-gray-400"
                            >
                                ****
                            </motion.div>
                        ) : (
                            <motion.div
                                key="unlocked"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="font-mono text-3xl font-bold tracking-widest text-slate-800"
                            >
                                {code}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

function WhatsAppButton({ label, sub, emoji, onClick }: any) {
    return (
        <motion.button
            whileHover={{ x: -4, backgroundColor: "rgba(255, 255, 255, 0.95)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="w-full bg-white/85 backdrop-blur-md border border-white/30 p-4 rounded-xl shadow-sm flex items-center justify-between group transition-all"
        >
            <div className="flex items-center gap-4">
                <div className="text-2xl bg-white/50 w-10 h-10 rounded-full flex items-center justify-center shadow-sm text-shadow">
                    {emoji}
                </div>
                <div className="text-right">
                    <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{label}</div>
                    <div className="text-xs text-slate-500">{sub}</div>
                </div>
            </div>
            <ChevronLeft className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </motion.button>
    );
}

function RecommendationCard({ title, image, tag }: any) {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="min-w-[160px] h-[200px] rounded-2xl overflow-hidden relative shadow-lg snap-center"
        >
            <img src={image} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-3 right-3 text-white">
                <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-white font-medium border border-white/20 mb-1 inline-block">
                    {tag}
                </span>
                <div className="font-bold text-lg leading-tight">{title}</div>
            </div>
        </motion.div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse opacity-50"></div>
                </div>
            </div>
        </div>
    );
}
