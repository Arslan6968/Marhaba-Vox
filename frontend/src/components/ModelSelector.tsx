import React from 'react';
import { Cpu, Sparkles, Check, Info } from 'lucide-react';
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
  const formats: { id: OutputFormat; name: string; tag: string; description: string }[] = [
    {
      id: 'wav',
      name: 'WAV',
      tag: 'Studio Lossless',
      description: 'Uncompressed 16-bit PCM (recommended for DAW editing)',
    },
    {
      id: 'flac',
      name: 'FLAC',
      tag: 'Compressed Lossless',
      description: 'Lossless audio with ~50% reduced file size',
    },
    {
      id: 'mp3',
      name: 'MP3',
      tag: 'High Bitrate 320k',
      description: 'LAME CBR 320 kbps (convenient, slight lossy compression)',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
      {/* AI Model Card */}
      <div className="bg-[#FFFFFF] border border-[#E8EAF0] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#F0EDFF] text-[#6558D9]">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#171923] uppercase tracking-wider">
                AI Separation Engine
              </span>
            </div>
            <span className="text-[11px] font-semibold text-[#16A36A] bg-[#16A36A]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16A36A]" />
              Verified & Installed
            </span>
          </div>

          <div className="space-y-2">
            {models.map((model) => {
              const isSelected = selectedModel === model.id;
              return (
                <div
                  key={model.id}
                  onClick={() => onSelectModel(model.id)}
                  className={`cursor-pointer p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-[#6558D9] bg-[#F0EDFF]/30 ring-1 ring-[#6558D9]'
                      : 'border-[#E8EAF0] hover:border-[#6558D9]/40 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-[#171923]">{model.name}</span>
                    <span className="text-[10px] font-semibold text-[#6558D9] bg-[#F0EDFF] px-2 py-0.5 rounded-md">
                      {model.architecture}
                    </span>
                  </div>
                  <p className="text-xs text-[#777D8C] mb-2 leading-relaxed">
                    {model.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#777D8C]">
                    <span className="bg-[#F6F7FB] px-2 py-0.5 rounded-md border border-[#E8EAF0] font-medium">
                      🎯 {model.quality}
                    </span>
                    <span className="bg-[#F6F7FB] px-2 py-0.5 rounded-md border border-[#E8EAF0] font-medium">
                      ⚡ {model.current_device} Mode
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Output Format Card */}
      <div className="bg-[#FFFFFF] border border-[#E8EAF0] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#F0EDFF] text-[#6558D9]">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-[#171923] uppercase tracking-wider">
                Output Stem Format
              </span>
            </div>
            <span className="text-[11px] text-[#777D8C]">Preserve dynamic range</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {formats.map((fmt) => {
              const isSelected = selectedFormat === fmt.id;
              return (
                <button
                  type="button"
                  key={fmt.id}
                  onClick={() => onSelectFormat(fmt.id)}
                  className={`text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#6558D9] bg-[#F0EDFF]/40 ring-1 ring-[#6558D9]'
                      : 'border-[#E8EAF0] hover:border-[#6558D9]/40 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-extrabold text-[#171923]">{fmt.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#6558D9]" />}
                    </div>
                    <span className="text-[10px] font-semibold text-[#6558D9] block mb-1">
                      {fmt.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#777D8C] line-clamp-2">
                    {fmt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-3 flex items-start gap-1.5 text-[11px] text-[#777D8C] bg-[#F6F7FB] p-2.5 rounded-xl border border-[#E8EAF0]">
          <Info className="w-3.5 h-3.5 text-[#6558D9] shrink-0 mt-0.5" />
          <span>
            {selectedFormat === 'mp3'
              ? 'MP3 employs perceptual psychoacoustic encoding. For mastering or critical production, WAV is recommended.'
              : 'Lossless audio output preserves full frequency spectrum (20Hz - 22kHz) without degradation.'}
          </span>
        </div>
      </div>
    </div>
  );
};
