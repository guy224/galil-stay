import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Unit, SeasonalPrice } from '../types/supabase';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, Plus, Trash2, Save, Calendar, CheckCircle } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { format } from 'date-fns';

export default function UnitSettings() {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState<'villa' | 'zimmer'>('villa');
    const [loading, setLoading] = useState(true);

    // Data State
    const [unit, setUnit] = useState<Unit | null>(null);
    const [seasonalPrices, setSeasonalPrices] = useState<SeasonalPrice[]>([]);

    // Form State (for Unit)
    const [formData, setFormData] = useState({
        base_price_weekday: 0,
        base_price_weekend: 0,
        default_min_nights: 1
    });

    // Special Period Modal/Form State
    const [isAddingPeriod, setIsAddingPeriod] = useState(false);
    const [newPeriod, setNewPeriod] = useState({
        name: '',
        start_date: '',
        end_date: '',
        price_per_night: 0,
        min_nights: 1
    });

    // Fetch Data
    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        console.log('Fetching settings for:', activeTab);

        try {
            // 1. Get Unit
            const { data: uData, error: uError } = await supabase
                .from('units')
                .select('*')
                .eq('id', activeTab)
                .single();

            if (uError) {
                console.error('Error fetching unit:', uError);
            } else if (uData) {
                console.log('Fetched unit data:', uData);
                setUnit(uData as Unit);
                setFormData({
                    base_price_weekday: uData.base_price_weekday,
                    base_price_weekend: uData.base_price_weekend,
                    default_min_nights: uData.default_min_nights
                });
            } else {
                console.warn('No unit found for ID:', activeTab);
            }

            // 2. Get Seasonal Prices
            const { data: sData, error: sError } = await supabase
                .from('seasonal_prices')
                .select('*')
                .eq('unit_id', activeTab)
                .order('start_date', { ascending: true });

            if (sError) {
                console.error('Error fetching seasonal:', sError);
            } else {
                setSeasonalPrices((sData || []) as SeasonalPrice[]);
            }

        } catch (err) {
            console.error('Unexpected error in fetchData:', err);
            addToast('שגיאה בטעינת הנתונים', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleSaveGeneral = async () => {
        if (!unit) return;

        console.log('Saving settings for:', activeTab, 'Data:', formData);

        try {
            const { error, data } = await supabase
                .from('units')
                .update({
                    base_price_weekday: Number(formData.base_price_weekday),
                    base_price_weekend: Number(formData.base_price_weekend),
                    default_min_nights: Number(formData.default_min_nights)
                })
                .eq('id', unit.id)
                .select();

            if (error) throw error;

            console.log('Save success:', data);

            if (!data || data.length === 0) {
                console.warn('Update returned no rows. ID mismatch?');
                alert('לא נמצא דף יחידה לעדכון (ID Mismatch)');
                return;
            }

            addToast('ההגדרות עודכנו בהצלחה', 'success');
            fetchData();

        } catch (err: any) {
            console.error('Save Error:', err);
            alert(`שגיאה בשמירת השינויים: ${err.message || 'Unknown error'}`);
            addToast('שגיאה בשמירה', 'error');
        }
    };

    const handleAddPeriod = async () => {
        if (!newPeriod.name || !newPeriod.start_date || !newPeriod.end_date) {
            addToast('נא למלא את כל השדות', 'error');
            return;
        }

        const { error } = await supabase
            .from('seasonal_prices')
            .insert([{
                unit_id: activeTab,
                ...newPeriod
            }]);

        if (error) {
            addToast('שגיאה בהוספת תקופה', 'error');
        } else {
            addToast('התקופה נוספה בהצלחה', 'success');
            setIsAddingPeriod(false);
            setNewPeriod({
                name: '',
                start_date: '',
                end_date: '',
                price_per_night: 0,
                min_nights: 1
            });
            fetchData();
        }
    };

    const handleDeletePeriod = async (id: string) => {
        if (!window.confirm('האם אתה בטוח שברצונך למחוק תקופה זו?')) return;

        const { error } = await supabase
            .from('seasonal_prices')
            .delete()
            .eq('id', id);

        if (error) {
            addToast('שגיאה במחיקת התקופה', 'error');
        } else {
            addToast('התקופה נמחקה', 'success');
            fetchData();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 md:p-10" dir="rtl">
            <div className="max-w-4xl mx-auto space-y-8">

                <header className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">ניהול מחירים והגדרות</h1>
                        <p className="text-gray-500 mt-1">קבע מחירים, מינימום לילות ותקופות מיוחדות</p>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-200 rounded-lg w-fit">
                    <button
                        onClick={() => setActiveTab('villa')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'villa'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        וילה בגליל
                    </button>
                    <button
                        onClick={() => setActiveTab('zimmer')}
                        className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'zimmer'
                            ? 'bg-white text-primary shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        צימר בין הנחלים
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">

                        {/* Section A: General Settings */}
                        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Save className="h-5 w-5 text-gray-400" />
                                    הגדרות כלליות
                                </h2>
                                <Button onClick={handleSaveGeneral}>
                                    שמור שינויים
                                </Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">מחיר בסיס (אמצ"ש) ₪</label>
                                    <Input
                                        type="number"
                                        value={formData.base_price_weekday}
                                        onChange={(e) => setFormData({ ...formData, base_price_weekday: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">מחיר בסיס (סופ"ש) ₪</label>
                                    <Input
                                        type="number"
                                        value={formData.base_price_weekend}
                                        onChange={(e) => setFormData({ ...formData, base_price_weekend: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">מינימום לילות (ברירת מחדל)</label>
                                    <Input
                                        type="number"
                                        value={formData.default_min_nights}
                                        onChange={(e) => setFormData({ ...formData, default_min_nights: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section B: Special Periods */}
                        <div className="bg-white rounded-xl border shadow-sm p-6 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    תקופות מיוחדות וחגים
                                </h2>
                                <Button variant="outline" onClick={() => setIsAddingPeriod(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    הוסף תקופה
                                </Button>
                            </div>

                            {/* Add New Period Form (Inline) */}
                            {isAddingPeriod && (
                                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 grid grid-cols-1 md:grid-cols-6 gap-3 items-end animate-in zoom-in-95">
                                    <div className="md:col-span-1 space-y-1">
                                        <label className="text-xs font-medium text-gray-600">שם התקופה</label>
                                        <Input value={newPeriod.name} onChange={e => setNewPeriod({ ...newPeriod, name: e.target.value })} placeholder="לדוגמה: פסח" />
                                    </div>
                                    <div className="md:col-span-1 space-y-1">
                                        <label className="text-xs font-medium text-gray-600">מתאריך</label>
                                        <Input type="date" value={newPeriod.start_date} onChange={e => setNewPeriod({ ...newPeriod, start_date: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-1 space-y-1">
                                        <label className="text-xs font-medium text-gray-600">עד תאריך</label>
                                        <Input type="date" value={newPeriod.end_date} onChange={e => setNewPeriod({ ...newPeriod, end_date: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-1 space-y-1">
                                        <label className="text-xs font-medium text-gray-600">מחיר ללילה</label>
                                        <Input type="number" value={newPeriod.price_per_night} onChange={e => setNewPeriod({ ...newPeriod, price_per_night: Number(e.target.value) })} />
                                    </div>
                                    <div className="md:col-span-1 space-y-1">
                                        <label className="text-xs font-medium text-gray-600">מינימום לילות</label>
                                        <Input type="number" value={newPeriod.min_nights} onChange={e => setNewPeriod({ ...newPeriod, min_nights: Number(e.target.value) })} />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleAddPeriod} className="w-full">שמור</Button>
                                        <Button size="sm" variant="ghost" onClick={() => setIsAddingPeriod(false)} className="px-2">ביטול</Button>
                                    </div>
                                </div>
                            )}

                            {/* Table */}
                            <div className="overflow-hidden border rounded-lg">
                                <table className="w-full text-sm text-right">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3">שם התקופה</th>
                                            <th className="px-4 py-3">תאריכים</th>
                                            <th className="px-4 py-3">מחיר ללילה</th>
                                            <th className="px-4 py-3">מינימום לילות</th>
                                            <th className="px-4 py-3 w-20"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {seasonalPrices.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                                    אין תקופות מיוחדות מוגדרות
                                                </td>
                                            </tr>
                                        ) : (
                                            seasonalPrices.map(p => (
                                                <tr key={p.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 font-medium">{p.name}</td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {format(new Date(p.start_date), 'dd/MM/yyyy')} - {format(new Date(p.end_date), 'dd/MM/yyyy')}
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-primary">₪{p.price_per_night}</td>
                                                    <td className="px-4 py-3">{p.min_nights}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => handleDeletePeriod(p.id)}
                                                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                )}
            </div>
        </div>
    );
}
