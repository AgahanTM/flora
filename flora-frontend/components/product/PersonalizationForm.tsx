"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { Sparkles, Palette, Type, Image as ImageIcon } from 'lucide-react';

import { apiClient } from '@/lib/api/client';
import { PersonalizationType, PersonalizationTemplate } from '@/lib/types/personalization';
import { parseJsonArray } from '@/lib/utils/jsonFields';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface PersonalizationFormProps {
  onDataChange: (data: any) => void;
  selectedPersonalizationType?: string; // This would typically come from the selected personalization addon
}

export function PersonalizationForm({ onDataChange, selectedPersonalizationType }: PersonalizationFormProps) {
  const [selectedType, setSelectedType] = useState<PersonalizationType | null>(null);
  const [formData, setFormData] = useState({
    templateId: '',
    customText: '',
    material: '',
    color: '',
    fileUrl: '',
  });

  const { data: types, isLoading } = useQuery<PersonalizationType[]>({
    queryKey: ['personalization-types'],
    queryFn: async () => {
      const { data } = await apiClient.get('/personalization/types');
      return data.data;
    },
  });

  const { data: templates } = useQuery<PersonalizationTemplate[]>({
    queryKey: ['personalization-templates', selectedType?.id],
    queryFn: async () => {
      if (!selectedType) return [];
      const { data } = await apiClient.get(`/personalization/templates?type_id=${selectedType.id}`);
      return data.data;
    },
    enabled: !!selectedType,
  });

  const updateForm = (updates: Partial<typeof formData>) => {
    const newData = { ...formData, ...updates };
    setFormData(newData);
    onDataChange({
      type_id: selectedType?.id,
      ...newData,
    });
  };

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" /></div>;

  return (
    <div className="bg-rose/5 rounded-3xl p-6 border border-rose/10 space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-rose" />
        <h3 className="font-display font-semibold text-xl text-bark">Personalize Your Gift</h3>
      </div>

      {/* Type Selection */}
      <div className="grid grid-cols-2 gap-3">
        {types?.map((type) => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type)}
            className={cn(
              "p-4 rounded-2xl border-2 text-center transition-all",
              selectedType?.id === type.id 
                ? "border-rose bg-white shadow-soft ring-1 ring-rose" 
                : "border-transparent bg-white/50 hover:bg-white"
            )}
          >
            <span className="text-sm font-medium text-bark">{type.name}</span>
          </button>
        ))}
      </div>

      {selectedType && (
        <div className="space-y-6 pt-4 border-t border-rose/10">
          
          {/* Templates */}
          {templates && templates.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-bark flex items-center gap-2">
                <Palette className="w-4 h-4" /> Pick a Design Template
              </label>
              <div className="grid grid-cols-3 gap-2">
                {templates.map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => updateForm({ templateId: tpl.id })}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                      formData.templateId === tpl.id ? "border-rose ring-2 ring-rose/20" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                  >
                    {tpl.preview_image_url ? (
                      <Image src={tpl.preview_image_url} alt={tpl.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-mist flex items-center justify-center text-[10px] text-center p-1">
                        {tpl.name}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Custom Text */}
          {selectedType.max_text_length && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-bark flex items-center gap-2">
                <Type className="w-4 h-4" /> Custom Inscription
              </label>
              <textarea
                maxLength={selectedType.max_text_length}
                value={formData.customText}
                onChange={(e) => updateForm({ customText: e.target.value })}
                placeholder="Enter your message..."
                className="w-full bg-white border-2 border-mist-dark/20 rounded-2xl p-4 text-sm focus:border-rose focus:ring-0 transition-all resize-none h-24"
              />
              <p className="text-[10px] text-right text-muted-foreground">
                {formData.customText.length} / {selectedType.max_text_length} chars
              </p>
            </div>
          )}

          {/* Materials & Colors */}
          <div className="grid grid-cols-2 gap-4">
            {selectedType.available_materials && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Material</label>
                <select
                  value={formData.material}
                  onChange={(e) => updateForm({ material: e.target.value })}
                  className="w-full bg-white border-2 border-mist-dark/20 rounded-xl h-10 px-3 text-xs focus:border-rose outline-none"
                >
                  <option value="">Select...</option>
                  {parseJsonArray<string>(selectedType.available_materials).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            )}
            {selectedType.available_colors && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Color</label>
                <select
                  value={formData.color}
                  onChange={(e) => updateForm({ color: e.target.value })}
                  className="w-full bg-white border-2 border-mist-dark/20 rounded-xl h-10 px-3 text-xs focus:border-rose outline-none"
                >
                  <option value="">Select...</option>
                  {parseJsonArray<string>(selectedType.available_colors).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* File Link */}
          {selectedType.requires_file && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-bark flex items-center gap-2">
                <ImageIcon className="w-4 h-4" /> Upload Reference (URL)
              </label>
              <input
                type="url"
                value={formData.fileUrl}
                onChange={(e) => updateForm({ fileUrl: e.target.value })}
                placeholder="https://your-image-link.com"
                className="w-full bg-white border-2 border-mist-dark/20 rounded-xl h-11 px-4 text-sm focus:border-rose outline-none"
              />
              <p className="text-[10px] text-muted-foreground italic">Paste a link to your reference image or 3D model.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
