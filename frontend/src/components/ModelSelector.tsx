import React from 'react';
import { Cpu, Sparkles, Check, Info, Zap } from 'lucide-react';
import type { ModelInfo, OutputFormat } from '../types';

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModel: string;
  onSelectModel: (id: string) => void;
  selectedFormat: OutputFormat;
  onSelectFormat: (fmt: OutputFormat) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModel,
  onSelectModel,
  selectedFormat,
  onSelectFormat,
}) => {
  const formats: { id: OutputFormat; name: string; tag: string; description: string; badge: string }[] = [
    {
      id: 'wav',
      name: 'WAV',
      tag: 'Studio Lossless',
      description: 'Uncompressed 16-bit PCM. Ideal for audio mastering and DAW workflows.',
      badge: 'Uncompressed',
    },
    {
      id: 'flac',
      name: 'FLAC',
      tag: 'Compressed Lossless',
      description: 'Bit-perfect audio reproduction with ~50% smaller file footprint.',
      badge: 'Lossless',
    },
    {
      id: 'mp3',
      name: 'MP3',
      tag: 'High Bitrate 320k',
      description: 'LAME CBR 320 kbps. Maximum compatibility for playback and sharing.',
      badge: '320 kbps',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
      {/* AI Model Card */}
      <div className="bg-white border border-[#E8EAF0] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#6558D9]/30 transition-all">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#F0EDFF] text-[#6558D9]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-[#171923] uppercase tracking-wider">
                  AI Separation Architecture
                </h3>
                <p className="text-[11px] text-[#777D8C]">Neural network engine</p>
              </div>
            </div>

            <span className="text-[11px] font-bold text-[#16A36A] bg-[#16A36A]/10 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A] animate-pulse" />
              Online & Ready
            </span>
          </div>

          <div className="space-y-2.5">
            {models.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => onSelectModel(model.id)}
                  className={`cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${
                    isSelected
                      ? 'border-[#6558D9] bg-gradient-to-r from-[#F0EDFF]/50 to-white ring-1 ring-[#6558D9] shadow-xs'
                      : 'border-[#E8EAF0] hover:border-[#6558D9]/40 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected ? 'border-[#6558D9] bg-[#6558D9]' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="font-extrabold text-sm text-[#171923]">{model.name}</span>
                    </div>

                    <span className="text-[10px] font-bold text-[#6558D9] bg-[#F0EDFF] px-2 py-0.5 rounded-md">
                      {model.architecture}
                    </span>
                  </div>

                  <p className="text-xs text-[#777D8C] mb-3 leading-relaxed pl-6">
                    {model.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#777D8C] pl-6">
                    <span className="bg-[#F6F7FB] px-2.5 py-0.5 rounded-lg border border-[#E8EAF0] font-semibold text-slate-700">
                      🎯 {model.quality}
                    </span>
                    <span className="bg-[#F6F7FB] px-2.5 py-0.5 rounded-lg border border-[#E8EAF0] font-semibold text-slate-700 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-500" />
                      {model.current_device} Acceleration
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Output Format Card */}
      <div className="bg-white border border-[#E8EAF0] rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between hover:border-[#6558D9]/30 transition-all">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#F0EDFF] text-[#6558D9]">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-extrabold text-[#171923] uppercase tracking-wider">
                  Output Stem Format
                </h3>
                <p className="text-[11px] text-[#777D8C]">Dynamic range & encoding</p>
              </div>
            </div>

            <span className="text-[11px] font-semibold text-slate-500 bg-[#F6F7FB] px-2.5 py-1 rounded-full border border-[#E8EAF0]">
              44.1 kHz Stereo
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {formats.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              return (
                <button
                  type="button"
                  key={fmt.id}
                  onClick={() => onSelectFormat(fmt.id)}
                  className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between group ${
                    isSelected
                      ? 'border-[#6558D9] bg-gradient-to-b from-[#F0EDFF]/60 to-white ring-1 ring-[#6558D9] shadow-xs'
                      : 'border-[#E8EAF0] hover:border-[#6558D9]/40 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold text-[#171923]">{fmt.name}</span>
                      {isSelected ? (
                        <div className="w-4 h-4 rounded-full bg-[#6558D9] text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 group-hover:border-[#6558D9]" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-[#6558D9] block mb-1">
                      {fmt.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#777D8C] line-clamp-2 mt-2 leading-tight">
                    {fmt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-[#777D8C] bg-[#F6F7FB] p-3 rounded-2xl border border-[#E8EAF0]">
          <Info className="w-4 h-4 text-[#6558D9] shrink-0 mt-0.5" />
          <span className="leading-relaxed text-[11px]">
            {selectedFormat === 'mp3'
              ? 'MP3 employs perceptual psychoacoustic encoding. For critical DAW production, WAV is recommended.'
              : 'Lossless audio output preserves the full frequency spectrum without harmonic phase loss.'}
          </span>
        </div>
      </div>
    </div>
  );
};
