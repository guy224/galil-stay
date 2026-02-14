import React, { useState, useRef, useEffect } from 'react';
import { Users, Minus, Plus, ChevronDown, Check } from 'lucide-react';
import { Button } from '../ui/Button';

interface GuestCounts {
    adults: number;
    children: number;
    infants: number;
    pets: number;
}

interface GuestSelectorProps {
    counts: GuestCounts;
    onChange: (counts: GuestCounts) => void;
    maxGuests?: number;
}

export function GuestSelector({ counts, onChange, maxGuests = 15 }: GuestSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateCount = (key: keyof GuestCounts, delta: number) => {
        const currentTotal = counts.adults + counts.children; // Infants don't count towards capacity usually
        const newCount = counts[key] + delta;

        // Validation for minimums
        if (key === 'adults' && newCount < 1) return;
        if (newCount < 0) return;

        // Validation for maximums (Infants/Pets might have their own or no limits)
        // If adding adult or child, check total capacity
        if ((key === 'adults' || key === 'children') && delta > 0) {
            if (currentTotal >= maxGuests) return;
        }

        onChange({
            ...counts,
            [key]: newCount
        });
    };

    const totalGuests = counts.adults + counts.children;
    const label = `${totalGuests} אורחים${counts.infants > 0 ? `, ${counts.infants} תינוקות` : ''}${counts.pets > 0 ? `, ${counts.pets} חיות מחמד` : ''}`;

    return (
        <div className="relative" ref={containerRef} dir="rtl">
            <label className="text-sm font-medium text-gray-700 block mb-1.5">הרכב אורחים</label>

            <button
                type="button"
                className={`w-full flex items-center justify-between px-3 py-2.5 bg-white border rounded-xl text-right transition-all duration-200 ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-900 truncate">{label}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 z-50 p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4">

                        {/* Adults */}
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-sm text-gray-900">מבוגרים</div>
                                <div className="text-xs text-gray-500">מגיל 13 ומעלה</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => updateCount('adults', -1)}
                                    disabled={counts.adults <= 1}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-5 text-center font-medium">{counts.adults}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => updateCount('adults', 1)}
                                    disabled={totalGuests >= maxGuests}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Children */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                            <div>
                                <div className="font-medium text-sm text-gray-900">ילדים</div>
                                <div className="text-xs text-gray-500">גילאים 2-12</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => updateCount('children', -1)}
                                    disabled={counts.children <= 0}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-5 text-center font-medium">{counts.children}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => updateCount('children', 1)}
                                    disabled={totalGuests >= maxGuests}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Infants */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                            <div>
                                <div className="font-medium text-sm text-gray-900">תינוקות</div>
                                <div className="text-xs text-gray-500">מתחת לגיל 2</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => updateCount('infants', -1)}
                                    disabled={counts.infants <= 0}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-5 text-center font-medium">{counts.infants}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => updateCount('infants', 1)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Pets */}
                        <div className="flex items-center justify-between border-t border-gray-50 pt-4">
                            <div>
                                <div className="font-medium text-sm text-gray-900">חיות מחמד</div>
                                <div className="text-xs text-gray-500">כלבים מותרים בתיאום</div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => updateCount('pets', -1)}
                                    disabled={counts.pets <= 0}
                                >
                                    <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-5 text-center font-medium">{counts.pets}</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => updateCount('pets', 1)}
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setIsOpen(false)}
                        >
                            <Check className="h-4 w-4 mr-1" />
                            סגור
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
