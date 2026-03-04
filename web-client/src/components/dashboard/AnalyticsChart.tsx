"use client"

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { useTheme } from 'next-themes';

interface ChartDataPoint {
    name: string;
    confidence: number;
    anxiety: number;
}

interface AnalyticsChartProps {
    data: ChartDataPoint[];
}

export function AnalyticsChart({ data }: AnalyticsChartProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const textColor = isDark ? '#a1a1aa' : '#71717a';
    const gridColor = isDark ? '#27272a' : '#e4e4e7';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: -20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke={textColor}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dy={10}
                />
                <YAxis
                    stroke={textColor}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    dx={-10}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    itemStyle={{ color: isDark ? '#fafafa' : '#09090b', fontSize: '14px' }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Confidence Score"
                />
                <Line
                    type="monotone"
                    dataKey="anxiety"
                    stroke="#ef4444"
                    strokeWidth={3}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Anxiety Level"
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
