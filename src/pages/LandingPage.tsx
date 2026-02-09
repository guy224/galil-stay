import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/Button';

export default function LandingPage() {
    return (
        <div className="flex flex-col md:flex-row min-h-screen">
            {/* Zimmer Section - Right (Hebrew Order) or Left based on direction. 
          Assuming LTR layout in code but RTL text. 
          Let's make it responsive: Top/Bottom on mobile, Left/Right on desktop. */}

            {/* Zimmer (Bin HaNechalim) */}
            <div className="relative group flex-1 min-h-[50vh] md:min-h-screen overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1587061949409-02df41d5e562?q=80&w=2070&auto=format&fit=crop")' }}
                >
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                </div>

                <div className="relative h-full flex flex-col items-center justify-center text-white p-8 text-center bg-black/20 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none">
                    <h2 className="text-4xl md:text-6xl font-bold mb-4 font-sans tracking-tight">בין הנחלים</h2>
                    <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-md">
                        חופשה רומנטית בצימר מעוצב מול הנוף
                    </p>
                    <Link to="/zimmer">
                        <Button size="lg" className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/50 text-white">
                            גלה עוד <ArrowLeft className="mr-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Villa (Beit Galili) */}
            <div className="relative group flex-1 min-h-[50vh] md:min-h-screen overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop")' }}
                >
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors" />
                </div>

                <div className="relative h-full flex flex-col items-center justify-center text-white p-8 text-center bg-black/20 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-none transition-all">
                    <h2 className="text-4xl md:text-6xl font-bold mb-4 font-sans tracking-tight">בית גלילי</h2>
                    <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-md">
                        וילת נופש יוקרתית למשפחות וקבוצות
                    </p>
                    <Link to="/villa">
                        <Button size="lg" variant="secondary" className="backdrop-blur-md bg-secondary/90 hover:bg-secondary border border-white/20">
                            גלה עוד <ArrowLeft className="mr-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
