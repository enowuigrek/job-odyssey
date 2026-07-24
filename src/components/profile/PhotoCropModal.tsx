import { useCallback, useEffect, useState } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Loader2 } from 'lucide-react';
import { Modal, Button } from '../ui';
import { getCroppedImageBlob } from '../../lib/cropImage';

interface PhotoCropModalProps {
  file: File;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
}

/** Modal do kadrowania zdjęcia profilowego — przeciąganie i zoom, wynik zawsze kwadratowy (pod okrągłe wyświetlanie w CV). */
export function PhotoCropModal({ file, onCancel, onConfirm }: PhotoCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setSaving(true);
    setError(null);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onConfirm(blob);
    } catch (e) {
      console.error(e);
      setError('Nie udało się przyciąć zdjęcia — spróbuj ponownie.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen title="Kadruj zdjęcie" onClose={onCancel} size="sm">
      <div className="space-y-4">
        <div className="relative w-full h-72 bg-dark-900">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          className="w-full accent-primary-500 cursor-pointer"
          aria-label="Przybliżenie"
        />
        {error && <p className="text-sm text-danger-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Anuluj
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !croppedAreaPixels}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Zapisz
          </Button>
        </div>
      </div>
    </Modal>
  );
}
