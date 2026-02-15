import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { isAfter, isBefore, startOfDay } from 'date-fns';
import {
    MapPin, Wifi, Key, BookOpen,
    Lock, Navigation,
    ChevronLeft, Star, Coffee,
    Flame, Snowflake, Smartphone, X
} from 'lucide-react';
import type { Booking } from '../../types/supabase';
import { useToast } from '../ui/Toast';

interface GuestLandingPageProps {
    booking: Booking;
}

// REAL HaGoshrim Recommendations
const RECOMMENDATIONS = [
    {
        id: 'coffee',
        title: 'קפה פילוסוף',
        description: 'עגלת קפה קסומה בתוך הקיבוץ, מול נוף ירוק ואווירה של חופש. הקפה הכי טוב לפתוח איתו את הבוקר.',
        image: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?q=80&w=2070&auto=format&fit=crop',
        locationLink: 'https://waze.com/ul/hsvc7u7f8z',
        tag: 'בית קפה'
    },
    {
        id: 'nature',
        title: 'עמק הנהר הנעלם',
        description: 'הסוד של הגושרים. מסלול הליכה קסום ומוצל בתוך הקיבוץ (נחל קורן), עם גשרים קטנים ופינות חמד.',
        image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2071&auto=format&fit=crop',
        locationLink: 'https://waze.com/ul/hsvc7u7k3e',
        tag: 'טבע'
    },
    {
        id: 'food',
        title: 'מסעדת פוקצ\'ה',
        description: 'מוסד קולינרי בגליל. אוכל איטלקי-ים תיכוני מעולה במתחם גן הצפון. חובה להזמין מקום מראש!',
        image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2070&auto=format&fit=crop',
        locationLink: 'https://waze.com/ul/hsvc7uk8u4',
        tag: 'מסעדה'
    }
];

// REAL House Guide
const HOUSE_GUIDE = [
    {
        title: 'אינטרנט וטלוויזיה',
        icon: Wifi,
        iconColor: 'text-blue-500',
        content: 'רשת ה-WiFi היא "Gali_Guest". הסיסמה מועתקת אוטומטית בכפתור הראשי. בטלוויזיה יש נטפליקס פתוח.'
    },
    {
        title: 'מטבח וקפה',
        icon: Coffee,
        iconColor: 'text-amber-600',
        content: 'מכונת הנספרסו לרשותכם (קפסולות במגירה). במקרר מחכים לכם מים קרים וחלב.'
    },
    {
        title: 'ג\'קוזי ומים חמים',
        icon: Flame,
        iconColor: 'text-red-500',
        content: 'הג\'קוזי מכוון ל-38 מעלות קבוע. להפעלת הזרמים לחצו על כפתור הבועות. המים במקלחת על גז (חמים תמיד).'
    },
    {
        title: 'מיזוג אוויר',
        icon: Snowflake,
        iconColor: 'text-cyan-500',
        content: 'שלטי המזגן על הקיר. מומלץ: 24 מעלות בקיץ, 28 בחורף.'
    },
    {
        title: 'חירום ורפואה',
        icon: Smartphone,
        iconColor: 'text-green-500',
        content: 'תיק עזרה ראשונה בארון אמבטיה. מרפאה וסופרמרקט נמצאים בתוך הקיבוץ.'
    }
];

export default function GuestLandingPage({ booking }: GuestLandingPageProps) {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [showGuideModal, setShowGuideModal] = useState(false);
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
        navigator.clipboard.writeText('Gali_Guest');
        addToast('הסיסמה הועתקה ללוח!', 'success');
    };

    // REAL HaGoshrim Waze Link
    const handleWaze = () => {
        window.open('https://waze.com/ul/hsvc7u7f8z', '_blank');
    };

    const handleWhatsApp = (text: string) => {
        const link = `https://wa.me/972501234567?text=${encodeURIComponent(text)}`;
        window.open(link, '_blank');
    };

    const handleRecommendationClick = (locationLink: string) => {
        window.open(locationLink, '_blank');
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
                        onClick={() => setShowGuideModal(true)}
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

                {/* REAL Recommendations Carousel */}
                <motion.div variants={itemVariants} className="mb-4">
                    <h3 className="text-white/90 font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider">
                        <MapPin className="h-4 w-4 text-green-400" />
                        ההמלצות שלנו בגושרים
                    </h3>
                    <div className="flex overflow-x-auto pb-4 gap-4 -mx-6 px-6 no-scrollbar snap-x">
                        {RECOMMENDATIONS.map((rec) => (
                            <RecommendationCard
                                key={rec.id}
                                title={rec.title}
                                image={rec.image}
                                tag={rec.tag}
                                description={rec.description}
                                onClick={() => handleRecommendationClick(rec.locationLink)}
                            />
                        ))}
                    </div>
                </motion.div>

                <div className="text-center text-white/40 text-xs mt-auto">
                    © Galil Stay Experience
                </div>
            </motion.div>

            {/* House Guide Modal */}
            <HouseGuideModal
                isOpen={showGuideModal}
                onClose={() => setShowGuideModal(false)}
            />
        </div>
    );
}

// --- Sub-Components ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ControlCard({ icon: Icon, label, onClick, delay }: any) {
    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RecommendationCard({ title, image, tag, description, onClick }: any) {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="min-w-[280px] h-[240px] rounded-2xl overflow-hidden relative shadow-lg snap-center group cursor-pointer"
        >
            <img src={image} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent group-hover:from-black/95" />
            <div className="absolute bottom-0 right-0 left-0 p-4 text-white">
                <span className="text-[10px] bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-white font-medium border border-white/20 mb-2 inline-block">
                    {tag}
                </span>
                <div className="font-bold text-xl leading-tight mb-1">{title}</div>
                <div className="text-xs text-white/80 leading-relaxed line-clamp-2">{description}</div>
                <div className="mt-2 text-xs text-white/60 flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    <span>לחץ לניווט בווייז</span>
                </div>
            </div>
        </motion.button>
    );
}

function HouseGuideModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 100, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 100, opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto border border-white/20"
                dir="rtl"
            >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-b from-white/95 to-white/80 backdrop-blur-xl p-6 border-b border-gray-200/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-xl">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">מדריך הבית</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {HOUSE_GUIDE.map((item, index) => (
                        <motion.div
                            key={item.title}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-200/60 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl bg-white shadow-sm ${item.iconColor}`}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-lg text-slate-800 mb-2">{item.title}</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed">{item.content}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gradient-to-t from-white/95 to-white/80 backdrop-blur-xl p-6 border-t border-gray-200/50">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                    >
                        סגור
                    </button>
                </div>
            </motion.div>
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
