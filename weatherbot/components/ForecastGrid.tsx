
import React from 'react';
import { ForecastDay } from '../types';
import * as Lucide from 'lucide-react';

interface ForecastGridProps {
  days: ForecastDay[];
}

const IconMap = {
  sun: <Lucide.Sun className="w-5 h-5 text-yellow-400" />,
  cloud: <Lucide.Cloud className="w-5 h-5 text-slate-400" />,
  rain: <Lucide.CloudRain className="w-5 h-5 text-blue-400" />,
  storm: <Lucide.CloudLightning className="w-5 h-5 text-purple-400" />,
  snow: <Lucide.CloudSnow className="w-5 h-5 text-blue-100" />,
  wind: <Lucide.Wind className="w-5 h-5 text-slate-300" />,
  'cloud-sun': <Lucide.CloudSun className="w-5 h-5 text-orange-300" />
};

export const ForecastGrid: React.FC<ForecastGridProps> = ({ days }) => {
  return (
    <div className="w-full mt-4 overflow-hidden border border-slate-700/50 rounded-2xl bg-slate-900/40">
      <div className="p-3 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/20">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">7-Day Outlook</span>
        <Lucide.Calendar className="w-3.5 h-3.5 text-slate-500" />
      </div>
      <div className="divide-y divide-slate-700/30">
        {days.map((day, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 hover:bg-slate-800/30 transition-colors">
            <div className="flex items-center gap-3 w-16">
              <span className="text-xs font-semibold text-slate-200">{day.day}</span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-center">
              {IconMap[day.icon] || IconMap.cloud}
              <span className="text-[10px] text-slate-400 hidden sm:inline">{day.condition}</span>
            </div>
            <div className="flex items-center gap-4 w-32 justify-end">
              <div className="flex items-center gap-1 text-[10px] text-blue-400/80">
                <Lucide.Droplets className="w-3 h-3" />
                <span>{day.rainChance}</span>
              </div>
              <div className="flex items-center gap-2 min-w-[60px] justify-end">
                <span className="text-xs font-bold text-white">{day.high}°</span>
                <span className="text-xs text-slate-500">{day.low}°</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
