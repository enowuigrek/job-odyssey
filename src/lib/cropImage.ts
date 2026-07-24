/** Piksele przycięcia zwracane przez react-easy-crop (onCropComplete). */
export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

const OUTPUT_SIZE = 480;

/** Wycina zaznaczony obszar i skaluje do stałego rozmiaru — jedna, przewidywalna wielkość pliku niezależnie od oryginału. */
export async function getCroppedImageBlob(imageSrc: string, crop: PixelCrop): Promise<Blob> {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context niedostępny');

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, OUTPUT_SIZE, OUTPUT_SIZE
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Nie udało się wyeksportować obrazu'))),
      'image/jpeg',
      0.9
    );
  });
}
