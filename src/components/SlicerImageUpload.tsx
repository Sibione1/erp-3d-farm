import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';

export interface SlicerData {
  projectName: string | null;
  hours: number;
  minutes: number;
  totalGrams: number;
  filaments: { id?: string; name: string; grams: number }[];
  rawText?: string;
}

interface SlicerImageUploadProps {
  onDataExtracted: (data: SlicerData, base64Image: string) => void;
  availableFilaments?: { id: string; name: string }[];
}

export default function SlicerImageUpload({ onDataExtracted, availableFilaments = [] }: SlicerImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const processImage = async (file: File) => {
    setIsUploading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = async () => {
        const originalBase64 = reader.result as string;
        
        // Compress image to prevent localStorage QuotaExceededError while keeping AI accurate
        const compressImage = (base64Str: string, maxWidth: number, quality: number): Promise<string> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = base64Str;
            img.onload = () => {
              const canvas = document.createElement('canvas');
              let width = img.width;
              let height = img.height;

              if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
              }

              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', quality));
              } else {
                resolve(base64Str);
              }
            };
            img.onerror = () => resolve(base64Str);
          });
        };

        // High quality for Gemini OCR (to read small tables)
        const base64ForAPI = await compressImage(originalBase64, 2500, 0.9);
        // Low quality for LocalStorage (to prevent QuotaExceededError)
        const base64ForStorage = await compressImage(originalBase64, 400, 0.3);

        try {
          const response = await fetch('/api/analyze-slicer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              image: base64ForAPI,
              availableFilaments
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Erro ao analisar imagem.');
          }

          onDataExtracted({
            projectName: data.projectName || null,
            hours: data.hours || 0,
            minutes: data.minutes || 0,
            totalGrams: data.totalGrams || 0,
            filaments: data.filaments || [],
            rawText: data.rawText || ''
          }, base64ForStorage);

          setSuccessMsg('Dados extraídos com sucesso!');
          setTimeout(() => setSuccessMsg(null), 3000); // clear after 3s
          
        } catch (err: any) {
          setError(err.message || 'Erro de conexão com a IA.');
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setError('Erro ao ler o arquivo de imagem.');
        setIsUploading(false);
      };

    } catch (err) {
      console.error(err);
      setError('Erro inesperado ao processar arquivo.');
      setIsUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      // Processa um por um para não sobrecarregar a API
      for (const file of acceptedFiles) {
        await processImage(file);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    }
  });

  // Global paste handler
  React.useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            await processImage(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, []);

  return (
    <div className="mb-4">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-[var(--solar-blue)] bg-[var(--solar-base02)]' : 'border-[var(--solar-base01)] hover:border-[var(--solar-blue)]'}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="flex flex-col items-center justify-center text-[var(--solar-blue)]">
            <Loader2 className="w-8 h-8 animate-spin mb-2" />
            <p className="text-sm font-bold">A IA está lendo o print...</p>
            <p className="text-xs opacity-70">Aguarde extração de peso e tempo</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-[var(--solar-base1)]">
            <div className="flex gap-2 mb-2">
              <UploadCloud className="w-8 h-8 text-[var(--solar-blue)]" />
              <ImageIcon className="w-8 h-8 text-[var(--solar-magenta)]" />
            </div>
            <p className="text-sm font-bold text-[var(--solar-base2)]">Autopreenchimento com IA (Gemini)</p>
            <p className="text-xs mt-1">Arraste aqui ou aperte <strong>Ctrl+V</strong> para colar um ou mais prints do Fatiador (Bandejas).</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 p-2 bg-red-100 border border-red-500 rounded flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mt-2 p-2 bg-[var(--solar-green)] bg-opacity-10 border border-[var(--solar-green)] rounded flex items-center gap-2 text-sm text-[var(--solar-green)]">
          <AlertCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}
    </div>
  );
}
