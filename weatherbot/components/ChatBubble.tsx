
import React from 'react';
import { MessageRole, WeatherMessage } from '../types';
import { ForecastGrid } from './ForecastGrid';
import { WeatherChart } from './WeatherChart';
import * as Lucide from 'lucide-react';

interface Props {
  message: WeatherMessage;
  onFeedback?: (id: string, feedback: 'up' | 'down') => void;
}

export const ChatBubble: React.FC<Props> = ({ message, onFeedback }) => {
  const isBot = message.role === MessageRole.BOT;
  const isAlert = message.isAlert;
  const alertType = message.alertType || 'warning';

  const alertStyles = {
    danger: 'border-red-500/50 bg-red-950/20 text-red-100',
    warning: 'border-amber-500/50 bg-amber-950/20 text-amber-100'
  };

  const alertIcons = {
    danger: <Lucide.AlertOctagon className="w-5 h-5 text-red-500" />,
    warning: <Lucide.AlertTriangle className="w-5 h-5 text-amber-500" />
  };

  return (
    <div className={`flex w-full mb-6 ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[92%] md:max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center border transition-all duration-300 ${
          isBot 
            ? isAlert 
              ? alertType === 'danger' ? 'bg-red-600/20 border-red-500/30' : 'bg-amber-600/20 border-amber-500/30'
              : 'bg-blue-600/20 border-blue-500/30 mr-3'
            : 'bg-slate-700/20 border-slate-600/30 ml-3'
        } ${isBot && !isAlert ? 'mr-3' : ''}`}>
          {isBot ? (
            isAlert ? alertIcons[alertType] : <Lucide.Cloud className="w-5 h-5 text-blue-400" />
          ) : (
            <Lucide.User className="w-5 h-5 text-slate-400" />
          )}
        </div>
        
        <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'} w-full`}>
          <div className={`p-4 rounded-2xl shadow-lg transition-all duration-500 w-full ${
            isBot 
              ? isAlert 
                ? `border ${alertStyles[alertType]} rounded-tl-none animate-pulse-slow`
                : 'glass text-slate-200 rounded-tl-none' 
              : 'bg-blue-600 text-white rounded-tr-none'
          }`}>
            {message.isThinking ? (
              <div className="flex space-x-2 items-center py-2 px-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
              </div>
            ) : (
              <div className={`whitespace-pre-wrap text-sm leading-relaxed ${isAlert ? 'font-medium' : ''}`}>
                {isAlert && (
                  <div className={`text-[10px] uppercase font-bold mb-1 tracking-widest flex items-center gap-1 ${
                    alertType === 'danger' ? 'text-red-400' : 'text-amber-400'
                  }`}>
                    {alertIcons[alertType]}
                    {alertType === 'danger' ? 'Severe Weather Danger' : 'Weather Alert'}
                  </div>
                )}
                {message.text}
                
                {/* Visual Data Components */}
                {isBot && message.chartData && message.chartData.length > 0 && (
                  <WeatherChart data={message.chartData} />
                )}
                
                {isBot && message.forecast && message.forecast.length > 0 && (
                  <ForecastGrid days={message.forecast} />
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between w-full mt-2 px-1">
            <div className="flex gap-2">
              {message.sources && message.sources.length > 0 && message.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-[10px] bg-slate-800/50 hover:bg-slate-700/50 text-slate-400 px-2 py-1 rounded-full transition-colors border border-slate-700"
                >
                  <Lucide.ExternalLink className="w-3 h-3 mr-1" />
                  {source.title.length > 20 ? source.title.substring(0, 20) + '...' : source.title}
                </a>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              {isBot && !message.isThinking && onFeedback && (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onFeedback(message.id, 'up')}
                    className={`p-1 rounded hover:bg-slate-800 transition-colors ${message.feedback === 'up' ? 'text-emerald-400' : 'text-slate-500'}`}
                    title="Helpful"
                  >
                    <Lucide.ThumbsUp className={`w-3 h-3 ${message.feedback === 'up' ? 'fill-emerald-400/20' : ''}`} />
                  </button>
                  <button 
                    onClick={() => onFeedback(message.id, 'down')}
                    className={`p-1 rounded hover:bg-slate-800 transition-colors ${message.feedback === 'down' ? 'text-rose-400' : 'text-slate-500'}`}
                    title="Not helpful"
                  >
                    <Lucide.ThumbsDown className={`w-3 h-3 ${message.feedback === 'down' ? 'fill-rose-400/20' : ''}`} />
                  </button>
                </div>
              )}
              <span className="text-[10px] text-slate-500">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
