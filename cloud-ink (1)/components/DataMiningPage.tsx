
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { SpinnerIcon, DatabaseIcon, MegaphoneIcon } from './icons';
import AnimatedWrapper from './AnimatedWrapper';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell
} from 'recharts';

interface ChartContainerProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, className = "" }) => (
    <div className={`bg-[#111827]/50 border border-cyan-500/20 rounded-xl p-6 shadow-lg backdrop-blur-sm flex flex-col h-[480px] ${className}`}>
        <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-2">{title}</h3>
        <div className="flex-1 w-full min-h-0">
            {children}
        </div>
    </div>
);

interface InsightCardProps {
    type: 'warning' | 'reminder' | 'info';
    title: string;
    message: string;
    action: string;
}

const InsightCard: React.FC<InsightCardProps> = ({ type, title, message, action }) => {
    const colors = {
        warning: 'border-red-500/50 bg-red-900/10 text-red-200',
        reminder: 'border-yellow-500/50 bg-yellow-900/10 text-yellow-200',
        info: 'border-blue-500/50 bg-blue-900/10 text-blue-200'
    };

    return (
        <div className={`p-4 rounded-lg border ${colors[type]} flex flex-col justify-between h-full transition-transform hover:scale-[1.02]`}>
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <MegaphoneIcon className="h-5 w-5 opacity-80" />
                    <h4 className="font-bold text-sm uppercase tracking-wider">{title}</h4>
                </div>
                <p className="text-sm opacity-90 mb-4">{message}</p>
            </div>
            <div className="text-xs font-mono bg-black/20 p-2 rounded border border-white/10">
                <span className="font-bold">Recommendation:</span> {action}
            </div>
        </div>
    );
};

const DataMiningPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    
    // Cross-Departmental Data States
    const [polypharmacyData, setPolypharmacyData] = useState<any[]>([]);
    const [serviceProfitability, setServiceProfitability] = useState<any[]>([]);
    
    const [insights, setInsights] = useState<InsightCardProps[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [
                    { data: billingData },
                    { data: apptData },
                    { data: patientsData },
                    { data: rxData },
                ] = await Promise.all([
                    supabase.from('billing_and_insurance').select('patient_id, total_charges, amount_covered_by_insurance'), 
                    supabase.from('appointments').select('*'), 
                    supabase.from('patients').select('patient_id, age, gender'),
                    supabase.from('prescriptions').select('patient_id, medication_id'),
                ]);

                const newInsights: InsightCardProps[] = [];

                // ----------------------------------------------------------------
                // 1. Patient Records + Pharmacy: Polypharmacy by Age (Age vs Rx Count)
                // ----------------------------------------------------------------
                if (patientsData && rxData) {
                    const patientAgeMap = new Map((patientsData as any[]).map((p: any) => [p.patient_id, p.age]));
                    const ageGroups: Record<string, { count: number, rxTotal: number }> = {
                        '0-18': { count: 0, rxTotal: 0 },
                        '19-35': { count: 0, rxTotal: 0 },
                        '36-50': { count: 0, rxTotal: 0 },
                        '51-65': { count: 0, rxTotal: 0 },
                        '65+': { count: 0, rxTotal: 0 }
                    };

                    // Count patients in groups
                    (patientsData as any[]).forEach((p: any) => {
                        const age = p.age;
                        let group = '65+';
                        if (age <= 18) group = '0-18';
                        else if (age <= 35) group = '19-35';
                        else if (age <= 50) group = '36-50';
                        else if (age <= 65) group = '51-65';
                        
                        ageGroups[group].count++;
                    });

                    // Count Rx per patient age
                    (rxData as any[]).forEach((r: any) => {
                        const age = patientAgeMap.get(r.patient_id);
                        if (age !== undefined) {
                            let group = '65+';
                            if (age <= 18) group = '0-18';
                            else if (age <= 35) group = '19-35';
                            else if (age <= 50) group = '36-50';
                            else if (age <= 65) group = '51-65';
                            
                            ageGroups[group].rxTotal++;
                        }
                    });

                    const polyData = Object.entries(ageGroups).map(([group, stats]) => ({
                        ageGroup: group,
                        avgRx: stats.count > 0 ? parseFloat((stats.rxTotal / stats.count).toFixed(1)) : 0
                    }));

                    setPolypharmacyData(polyData);

                    // Dynamic Insight: Find highest load group
                    const highestLoad = [...polyData].sort((a,b) => b.avgRx - a.avgRx)[0];
                    if (highestLoad && highestLoad.avgRx > 0) {
                         newInsights.push({
                            type: 'info',
                            title: 'Patients & Pharmacy: Polypharmacy Trend',
                            message: `The ${highestLoad.ageGroup} demographic has the highest medication burden averaging ${highestLoad.avgRx} scripts/patient.`,
                            action: 'Implement automated drug interaction screening for this group.'
                        });
                    }
                }

                // ----------------------------------------------------------------
                // 2. Billing + Appointments: Service Profitability (Appt Type vs Coverage)
                // ----------------------------------------------------------------
                if (apptData && billingData) {
                    // Create map of patient -> average coverage %
                    const patientCoverage: Record<number, number> = {};
                    (billingData as any[]).forEach((b: any) => {
                         const coveragePct = b.total_charges > 0 ? (b.amount_covered_by_insurance / b.total_charges) : 0;
                         patientCoverage[b.patient_id] = coveragePct;
                    });

                    const serviceStats: Record<string, { count: number, totalCov: number }> = {};
                    
                    (apptData as any[]).forEach((a: any) => {
                        const type = a.appt_type || 'General';
                        const cov = patientCoverage[a.patient_id];
                        if (cov !== undefined) {
                            if (!serviceStats[type]) serviceStats[type] = { count: 0, totalCov: 0 };
                            serviceStats[type].count++;
                            serviceStats[type].totalCov += cov;
                        }
                    });

                    const profitData = Object.entries(serviceStats).map(([type, stats]) => ({
                        type,
                        coverage: parseFloat(((stats.totalCov / stats.count) * 100).toFixed(1))
                    })).sort((a,b) => a.coverage - b.coverage);

                    setServiceProfitability(profitData);

                    // Dynamic Insight: Find lowest coverage service
                    const lowCovService = profitData[0];
                    if (lowCovService) {
                        newInsights.push({
                            type: 'warning',
                            title: 'Billing & Appts: Low Coverage Service',
                            message: `"${lowCovService.type}" appointments have the lowest insurance coverage (${lowCovService.coverage}%).`,
                            action: 'Review coding guidelines and payer contracts.'
                        });
                    }
                }

                setInsights(newInsights);

            } catch (error) {
                console.error("Error fetching mining data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-cyan-400">
                <SpinnerIcon className="h-12 w-12 animate-spin mb-4" />
                <p className="text-gray-300">Correlating Cross-Departmental Data...</p>
            </div>
        );
    }

    return (
        <AnimatedWrapper delay={0}>
             <div className="max-w-7xl mx-auto space-y-8 pb-10">
                <div className="p-8 bg-[#111827]/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10">
                    <div className="flex items-center gap-6 mb-2">
                        <DatabaseIcon className="h-16 w-16 text-cyan-400" />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider">Inter-Departmental Mining</h1>
                            <p className="mt-2 text-md text-[#A9B4C2]">
                                Uncovering hidden relationships between HR, Billing, Clinical Operations, and Pharmacy.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- INSIGHTS --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {insights.map((insight, idx) => (
                        <AnimatedWrapper key={idx} delay={idx * 100}>
                            <InsightCard {...insight} />
                        </AnimatedWrapper>
                    ))}
                    {insights.length === 0 && (
                        <div className="col-span-full p-6 text-center text-gray-400 border border-gray-700 border-dashed rounded-lg">
                            No significant cross-departmental anomalies detected.
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     
                    {/* 1. Patients + Pharmacy */}
                    <ChartContainer title="Patients & Pharmacy: Polypharmacy by Age" className="border-purple-500/30">
                         <div className="flex flex-col h-full">
                            <div className="mb-2 text-xs text-purple-300 italic">
                                Average number of unique prescriptions per patient, grouped by age demographics.
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={polypharmacyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRx" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="ageGroup" stroke="#9CA3AF" />
                                        <YAxis stroke="#9CA3AF" />
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }} />
                                        <Area type="monotone" dataKey="avgRx" stroke="#a855f7" fillOpacity={1} fill="url(#colorRx)" name="Avg Prescriptions" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                         </div>
                    </ChartContainer>

                    {/* 2. Billing + Appts */}
                    <ChartContainer title="Billing & Appts: Service Type Coverage" className="border-green-500/30">
                         <div className="flex flex-col h-full">
                            <div className="mb-2 text-xs text-green-300 italic">
                                Average Insurance Coverage % broken down by Clinical Appointment Type.
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={serviceProfitability} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis 
                                            dataKey="type" 
                                            stroke="#9CA3AF" 
                                            tick={{fontSize: 10, angle: -45, textAnchor: 'end'}} 
                                            interval={0} 
                                        />
                                        <YAxis unit="%" stroke="#9CA3AF" domain={[0, 100]} />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                        />
                                        <Bar dataKey="coverage" name="Avg Coverage %" fill="#10b981">
                                            {serviceProfitability.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.coverage < 60 ? '#ef4444' : '#10b981'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </ChartContainer>
                </div>
            </div>
        </AnimatedWrapper>
    );
};

export default DataMiningPage;
