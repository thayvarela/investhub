import React from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { CHART_COLORS } from '../constants';
import { ChartDataPoint, HistoryDataPoint } from '../types';

interface PortfolioPieChartProps {
  data: ChartDataPoint[];
  onClickSegment: (data: any) => void;
  title?: string;
}

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const RADIAN = Math.PI / 180;
  // Position the label outside the pie
  const radius = outerRadius * 1.1; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  // Only show label if percentage is significant enough to avoid clutter
  if (percent < 0.01) return null;

  return (
    <text 
      x={x} 
      y={y} 
      fill="#94a3b8" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central" 
      fontSize={11}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export const PortfolioPieChart: React.FC<PortfolioPieChartProps> = ({ data, onClickSegment, title }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        Sem dados para exibir
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            cursor="pointer"
            onClick={onClickSegment}
            label={renderCustomizedLabel}
            labelLine={true}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color || CHART_COLORS[index % CHART_COLORS.length]} 
                stroke="#1e293b"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, name: string, props: any) => [
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
              `${name} (${(props.payload.percent * 100).toFixed(1)}%)`
            ]}
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span className="text-slate-300 ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      {title && (
        <div className="absolute top-0 left-0 w-full text-center pointer-events-none">
           <span className="text-sm text-slate-400 font-medium bg-dark-card/80 px-2 py-1 rounded-full">{title}</span>
        </div>
      )}
    </div>
  );
};

interface HistoryChartProps {
  data: HistoryDataPoint[];
}

export const HistoryAreaChart: React.FC<HistoryChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-400">
        Carregando histórico...
      </div>
    );
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tick={{fontSize: 12}}
            tickFormatter={(str) => {
              const d = new Date(str);
              return `${d.getDate()}/${d.getMonth()+1}`;
            }}
            minTickGap={30}
          />
          <YAxis 
            stroke="#94a3b8" 
            tick={{fontSize: 12}}
            tickFormatter={(val) => 
              new Intl.NumberFormat('pt-BR', { notation: "compact", compactDisplay: "short" }).format(val)
            }
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
            labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
            formatter={(value: number) => 
              new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
            }
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#0ea5e9" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            name="Patrimônio Total"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};