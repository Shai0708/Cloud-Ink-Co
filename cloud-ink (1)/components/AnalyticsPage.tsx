
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { SpinnerIcon, ChartIcon, MegaphoneIcon } from './icons';
import AnimatedWrapper from './AnimatedWrapper';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell, Legend, ScatterChart, Scatter
} from 'recharts';

interface ChartContainerProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

const ChartContainer: React.FC<ChartContainerProps> = ({ title, children, className = "" }) => (
    <div className={`bg-[#111827]/50 border border-cyan-500/20 rounded-xl p-6 shadow-lg backdrop-blur-sm flex flex-col h-[450px] ${className}`}>
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

const PIE_COLORS = ['#22d3ee', '#3b82f6', '#a855f7', '#f43f5e', '#10b981'];

const AnalyticsPage: React.FC = () => {
    const [loading, setLoading] = useState(true);
    
    // Standard Analytics States
    const [visitTrends, setVisitTrends] = useState<any[]>([]);
    const [apptByDoctor, setApptByDoctor] = useState<any[]>([]);
    const [deptMatrix, setDeptMatrix] = useState<any[]>([]);
    const [topMeds, setTopMeds] = useState<any[]>([]);
    
    // Moved from Data Mining
    const [providerRoiData, setProviderRoiData] = useState<any[]>([]);
    const [noShowDemographics, setNoShowDemographics] = useState<any[]>([]);
    
    const [insights, setInsights] = useState<InsightCardProps[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

                // Fetch data in parallel
                const [
                    { data: billingData },
                    { data: rawApptData },
                    { data: employeesData },
                    { data: patientsData },
                    { data: rxData },
                    { data: medData }
                ] = await Promise.all([
                    supabase.from('billing_and_insurance').select('*'), 
                    supabase.from('appointments').select('*'), 
                    supabase.from('employees').select('employee_id, full_name, salary, department_name'),
                    supabase.from('patients').select('patient_id, age, gender'),
                    supabase.from('prescriptions').select('*'),
                    supabase.from('medications').select('medication_id, generic_name')
                ]);

                const newInsights: InsightCardProps[] = [];

                // 1. Data Prep & Maps
                const validPatientIds = new Set((patientsData as any[])?.map((p: any) => p.patient_id));
                const employeeMap = new Map((employeesData as any[])?.map((e: any) => [e.employee_id, e]));
                const medMap = new Map((medData as any[])?.map((m: any) => [String(m.medication_id), m.generic_name]));

                // Enrich Appointments
                const apptData = (rawApptData as any[])?.map((a: any) => ({
                    ...a,
                    patients: validPatientIds.has(a.patient_id) ? { patient_id: a.patient_id } : null,
                    employees: employeeMap.get(a.employee_id) || null
                }));

                // ---------------------------------------------------------
                // STANDARD ANALYTICS CALCULATIONS
                // ---------------------------------------------------------

                // Visit Trends
                let processedTrends: any[] = [];
                if (apptData) {
                    const monthlyVisits: Record<string, { count: number; date: number }> = {};
                    apptData.forEach((appt: any) => {
                        if (!appt.patients) return;
                        const date = new Date(appt.appt_datetime);
                        if(isNaN(date.getTime())) return;
                        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
                        const key = monthStart.toLocaleDateString('default', { month: 'short', year: 'numeric' });
                        const sortKey = monthStart.getTime();
                        if (!monthlyVisits[key]) monthlyVisits[key] = { count: 0, date: sortKey };
                        monthlyVisits[key].count += 1;
                    });
                    processedTrends = Object.values(monthlyVisits).sort((a, b) => a.date - b.date).map((val: any) => ({ name: new Date(val.date).toLocaleDateString('default', {month:'short', year:'numeric'}), count: val.count }));
                    setVisitTrends(processedTrends);
                }

                // Top Doctors
                let processedDocs: any[] = [];
                if (apptData) {
                    const doctorMap: Record<string, number> = {};
                    apptData.forEach((appt: any) => {
                        if (!appt.patients) return;
                        const empName = appt.employees?.full_name || `ID: ${appt.employee_id}`;
                        doctorMap[empName] = (doctorMap[empName] || 0) + 1;
                    });
                    processedDocs = Object.keys(doctorMap).map(key => ({ name: key, count: doctorMap[key] })).sort((a, b) => b.count - a.count).slice(0, 10);
                    setApptByDoctor(processedDocs);
                }

                // Top Meds (Recent)
                let processedMeds: any[] = [];
                if (rxData && medMap) {
                    const recentRx = (rxData as any[]).filter((rx: any) => new Date(rx.prescription_date) >= startOfMonth);
                    const rxCount: Record<string, number> = {};
                    recentRx.forEach((rx: any) => {
                        const name = medMap.get(String(rx.medication_id)) || 'Unknown';
                        rxCount[name] = (rxCount[name] || 0) + 1;
                    });
                    processedMeds = Object.entries(rxCount).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
                    setTopMeds(processedMeds);
                }

                // Dept Matrix
                let processedMatrix: any[] = [];
                if (employeesData && apptData && billingData) {
                    const monthlyAppts = apptData.filter((a: any) => new Date(a.appt_datetime) >= startOfMonth && !!a.patients);
                    const depts: Record<string, any> = {};
                    const normalize = (str: string | null) => str ? str.trim() : 'Unassigned';

                    (employeesData as any[]).forEach((e: any) => {
                         const dName = normalize(e.department_name as string);
                         if(!depts[dName]) depts[dName] = { staff: 0, appts: 0, patients: new Set(), revenue: 0 };
                         depts[dName].staff++;
                    });

                    const empDeptMap: Record<number, string> = {};
                    (employeesData as any[]).forEach((e: any) => empDeptMap[e.employee_id] = normalize(e.department_name as string));

                    // Patient Spend (Current Month)
                    const patientSpend: Record<number, number> = {};
                    (billingData as any[]).filter((b:any) => new Date(b.admission_date) >= startOfMonth).forEach((b: any) => {
                        const pid = b.patient_id as number;
                        patientSpend[pid] = (patientSpend[pid] || 0) + b.total_charges;
                    });

                    const patientVisitCounts: Record<number, number> = {};
                    monthlyAppts.forEach((a: any) => {
                        if (a.patient_id) patientVisitCounts[a.patient_id] = (patientVisitCounts[a.patient_id] || 0) + 1;
                    });

                    monthlyAppts.forEach((a: any) => {
                        const dept = empDeptMap[a.employee_id];
                        if (dept && depts[dept]) {
                            depts[dept].appts++;
                            if (a.patient_id) {
                                depts[dept].patients.add(a.patient_id);
                                const revenue = patientSpend[a.patient_id] || 0;
                                const visits = patientVisitCounts[a.patient_id] || 1;
                                depts[dept].revenue += revenue / visits;
                            }
                        }
                    });

                    processedMatrix = Object.entries(depts).map(([name, data]) => ({
                        department: name,
                        staff: data.staff,
                        appts: data.appts,
                        unique_patients: data.patients.size,
                        revenue: Math.round(data.revenue),
                        efficiency: data.staff > 0 ? Math.round(data.revenue / data.staff) : 0
                    })).sort((a,b) => b.revenue - a.revenue);
                    
                    setDeptMatrix(processedMatrix);
                }

                // ---------------------------------------------------------
                // MOVED FROM DATA MINING
                // ---------------------------------------------------------
                
                // Provider ROI
                if (employeesData && rawApptData && billingData) {
                    const patientRevenue: Record<number, number> = {};
                    (billingData as any[]).forEach((b: any) => {
                        patientRevenue[b.patient_id] = (patientRevenue[b.patient_id] || 0) + b.total_charges;
                    });

                    const empPatientMap: Record<number, Set<number>> = {};
                    (rawApptData as any[]).forEach((a: any) => {
                        if (!empPatientMap[a.employee_id]) empPatientMap[a.employee_id] = new Set();
                        empPatientMap[a.employee_id].add(a.patient_id);
                    });

                    const roiData = (employeesData as any[])
                        .filter(e => e.salary > 0 && empPatientMap[e.employee_id])
                        .map((e: any) => {
                            const patients = Array.from(empPatientMap[e.employee_id] || []);
                            const revenue = patients.reduce((sum, pid) => sum + (patientRevenue[pid] || 0), 0);
                            return {
                                name: e.full_name,
                                salary: e.salary,
                                revenue: revenue,
                                roi: revenue / (e.salary || 1),
                                department: e.department_name
                            };
                        });

                    setProviderRoiData(roiData);

                    // ROI Insight
                    const lowRoiProvider = roiData.find(d => d.revenue < d.salary * 1.5 && d.salary > 100000);
                    if (lowRoiProvider) {
                        newInsights.push({
                            type: 'warning',
                            title: 'Negative ROI Detected',
                            message: `Provider ${lowRoiProvider.name} (Salary: $${lowRoiProvider.salary.toLocaleString()}) generated only $${lowRoiProvider.revenue.toLocaleString()} revenue.`,
                            action: 'Review patient volume allocations.'
                        });
                    }
                }

                // No-Show Analysis
                if (patientsData && rawApptData) {
                    const patientAgeMap = new Map((patientsData as any[]).map((p: any) => [p.patient_id, p.age]));
                    const ageBuckets: Record<string, { total: number, missed: number }> = {
                        'Young Adult (18-30)': { total: 0, missed: 0 },
                        'Adult (31-50)': { total: 0, missed: 0 },
                        'Senior (51+)': { total: 0, missed: 0 }
                    };

                    (rawApptData as any[]).forEach((a: any) => {
                        const age = patientAgeMap.get(a.patient_id);
                        if (!age) return;

                        let bucket = 'Senior (51+)';
                        if (age <= 30) bucket = 'Young Adult (18-30)';
                        else if (age <= 50) bucket = 'Adult (31-50)';

                        ageBuckets[bucket].total++;
                        const status = (a.status || '').toLowerCase();
                        if (status === 'no show' || status === 'cancelled') {
                            ageBuckets[bucket].missed++;
                        }
                    });

                    const noShowData = Object.entries(ageBuckets).map(([group, stats]) => ({
                        group,
                        missRate: stats.total > 0 ? parseFloat(((stats.missed / stats.total) * 100).toFixed(1)) : 0
                    }));

                    setNoShowDemographics(noShowData);

                    // No-Show Insight
                    const highMissGroup = noShowData.sort((a,b) => b.missRate - a.missRate)[0];
                    if (highMissGroup && highMissGroup.missRate > 15) {
                        newInsights.push({
                            type: 'reminder',
                            title: 'Attendance Patterns',
                            message: `${highMissGroup.group} group has the highest cancellation rate (${highMissGroup.missRate}%).`,
                            action: 'Implement targeted SMS reminders.'
                        });
                    }
                }

                // ---------------------------------------------------------
                // GENERATE REMAINING INSIGHTS
                // ---------------------------------------------------------
                
                // 1. Department Efficiency Insight
                if (processedMatrix.length > 0) {
                    const topEffDept = [...processedMatrix].sort((a,b) => b.efficiency - a.efficiency)[0];
                    if (topEffDept && topEffDept.efficiency > 0) {
                        newInsights.push({
                            type: 'info',
                            title: 'Dept Efficiency Leader',
                            message: `${topEffDept.department} leads with $${topEffDept.efficiency.toLocaleString()} revenue per staff member.`,
                            action: 'Analyze workflow for best practices.'
                        });
                    }
                }

                // 2. Visit Trend Insight
                if (processedTrends.length >= 2) {
                    const current = processedTrends[processedTrends.length - 1];
                    const prev = processedTrends[processedTrends.length - 2];
                    const diff = current.count - prev.count;
                    const pct = prev.count > 0 ? ((diff / prev.count) * 100).toFixed(1) : 0;
                    
                    if (diff < 0) {
                         newInsights.push({
                            type: 'warning',
                            title: 'Volume Decline Detected',
                            message: `Patient visits decreased by ${Math.abs(Number(pct))}% compared to last month.`,
                            action: 'Investigate scheduling bottlenecks.'
                        });
                    } else if (diff > 0) {
                        newInsights.push({
                            type: 'info',
                            title: 'Volume Growth',
                            message: `Patient visits increased by ${pct}% compared to last month.`,
                            action: 'Ensure staffing levels are adequate.'
                        });
                    }
                }

                // 3. Top Provider Insight
                if (processedDocs.length > 0) {
                    const topDoc = processedDocs[0];
                    if (topDoc.count > 10) { // arbitrary threshold
                        newInsights.push({
                            type: 'reminder',
                            title: 'High Provider Workload',
                            message: `${topDoc.name} has the highest volume with ${topDoc.count} appointments.`,
                            action: 'Consider assigning additional support staff.'
                        });
                    }
                }

                // 4. Medication Insight
                if (processedMeds.length > 0) {
                    const topMed = processedMeds[0];
                    newInsights.push({
                        type: 'info',
                        title: 'Top Prescribed Med',
                        message: `${topMed.name} is the most prescribed drug (${topMed.value} scripts).`,
                        action: 'Verify pharmacy inventory levels.'
                    });
                }

                setInsights(newInsights);

            } catch (error) {
                console.error("Error fetching analytics:", error);
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
                <p className="text-gray-300">Loading analytics dashboard...</p>
            </div>
        );
    }

    return (
        <AnimatedWrapper delay={0}>
            <div className="max-w-7xl mx-auto space-y-8 pb-10">
                <div className="p-8 bg-[#111827]/50 backdrop-blur-sm border border-cyan-500/20 rounded-xl shadow-2xl shadow-cyan-500/10">
                    <div className="flex items-center gap-6 mb-2">
                        <ChartIcon className="h-16 w-16 text-cyan-400" />
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white tracking-wider">Advanced Analytics</h1>
                            <p className="mt-2 text-md text-[#A9B4C2]">
                                Real-time operational intelligence and performance metrics.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- INSIGHTS (3x2 Grid) --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {insights.map((insight, idx) => (
                        <AnimatedWrapper key={idx} delay={idx * 100}>
                            <InsightCard {...insight} />
                        </AnimatedWrapper>
                    ))}
                    {insights.length === 0 && (
                        <div className="col-span-full p-6 text-center text-gray-400 border border-gray-700 border-dashed rounded-lg">
                            No immediate operational alerts detected.
                        </div>
                    )}
                </div>

                {/* --- DEPARTMENT PERFORMANCE MATRIX --- */}
                <div className="bg-[#111827]/50 border border-cyan-500/20 rounded-xl p-6 shadow-lg backdrop-blur-sm">
                    <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                        <h3 className="text-xl font-semibold text-white">Department Performance Matrix (This Month)</h3>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-cyan-400 text-sm border-b border-gray-700">
                                    <th className="py-3 px-4 font-bold uppercase tracking-wider">Department</th>
                                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Staff Count</th>
                                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Appt. Volume</th>
                                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Unique Patients</th>
                                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Est. Revenue ($)</th>
                                    <th className="py-3 px-4 font-bold uppercase tracking-wider text-right">Rev / Staff ($)</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-300 text-sm">
                                {deptMatrix.map((dept, idx) => (
                                    <tr key={idx} className="border-b border-gray-800 hover:bg-cyan-950/20 transition-colors">
                                        <td className="py-3 px-4 font-medium text-white">{dept.department}</td>
                                        <td className="py-3 px-4 text-right">{dept.staff}</td>
                                        <td className="py-3 px-4 text-right">{dept.appts}</td>
                                        <td className="py-3 px-4 text-right">{dept.unique_patients}</td>
                                        <td className="py-3 px-4 text-right text-green-400 font-mono">{dept.revenue.toLocaleString()}</td>
                                        <td className="py-3 px-4 text-right font-mono">
                                            <span className={`px-2 py-1 rounded ${dept.efficiency > 50000 ? 'bg-green-900/40 text-green-300' : 'bg-gray-800'}`}>
                                                {dept.efficiency.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- VISIT FREQUENCY --- */}
                <ChartContainer title="Patient Visit Frequency (Monthly)">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={visitTrends} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="visitColor" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" stroke="#9CA3AF" />
                            <YAxis stroke="#9CA3AF" />
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }} />
                            <Area type="monotone" dataKey="count" stroke="#22d3ee" fillOpacity={1} fill="url(#visitColor)" name="Visits" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* --- TOP DOCTORS & MEDICATIONS ROW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* --- TOP DOCTORS --- */}
                    <ChartContainer title="Top 10 Providers by Volume">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={apptByDoctor} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis type="number" stroke="#9CA3AF" />
                                <YAxis dataKey="name" type="category" width={120} stroke="#9CA3AF" tick={{fontSize: 11}} />
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }} />
                                <Bar dataKey="count" fill="#3b82f6" name="Appointments" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>

                    {/* --- TOP MEDICATIONS --- */}
                    <ChartContainer title="Top Prescribed Meds (This Month)">
                        {topMeds.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={topMeds}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={true}
                                        label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {topMeds.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }} 
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36}
                                        wrapperStyle={{ paddingTop: '20px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-gray-500 italic">
                                No prescription data available for this month.
                            </div>
                        )}
                    </ChartContainer>
                </div>

                {/* --- MOVED CHARTS: ROI & NO-SHOW --- */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Provider ROI */}
                    <ChartContainer title="Provider ROI Efficiency" className="border-cyan-500/30">
                        <div className="flex flex-col h-full">
                            <div className="mb-2 text-xs text-cyan-300 italic">
                                X: Provider Salary (Cost) vs Y: Associated Patient Revenue (Value).
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis type="number" dataKey="salary" name="Salary" unit="$" stroke="#9CA3AF" />
                                        <YAxis type="number" dataKey="revenue" name="Revenue" unit="$" stroke="#9CA3AF" />
                                        <Tooltip 
                                            cursor={{ strokeDasharray: '3 3' }} 
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const data = payload[0].payload;
                                                    return (
                                                        <div className="bg-[#1F2937] border border-gray-600 p-2 rounded text-white text-xs">
                                                            <p className="font-bold">{data.name}</p>
                                                            <p>{data.department}</p>
                                                            <p>Salary: ${data.salary.toLocaleString()}</p>
                                                            <p>Rev Generated: ${data.revenue.toLocaleString()}</p>
                                                            <p className="text-cyan-400">ROI: {data.roi.toFixed(2)}x</p>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Scatter name="Providers" data={providerRoiData} fill="#22d3ee" fillOpacity={0.7} />
                                    </ScatterChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </ChartContainer>

                    {/* No-Show Analysis */}
                    <ChartContainer title="No-Show Analysis by Age" className="border-red-500/30">
                        <div className="flex flex-col h-full">
                            <div className="mb-2 text-xs text-red-300 italic">
                                Percentage of Cancelled/No-Show appointments by patient age group.
                            </div>
                            <div className="flex-1 min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={noShowDemographics} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                        <XAxis type="number" unit="%" stroke="#9CA3AF" domain={[0, 100]} />
                                        <YAxis dataKey="group" type="category" width={120} stroke="#9CA3AF" tick={{fontSize: 11}} />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: '#fff' }}
                                        />
                                        <Bar dataKey="missRate" name="Miss Rate %" fill="#ef4444" radius={[0, 4, 4, 0]} />
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

export default AnalyticsPage;

