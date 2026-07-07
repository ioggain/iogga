// Subida real de fotos, sin servidores extra: la foto se comprime en el
// teléfono y se guarda como texto (base64) en Firestore. Módulo independiente
// para poder cambiarlo por Firebase Storage u otro servicio en el futuro.

export function pickImage(maxSide = 900, quality = 0.72): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          // Firestore admite documentos de hasta ~1MB: recomprimir si hace falta
          let q = quality;
          while (dataUrl.length > 700_000 && q > 0.3) {
            q -= 0.15;
            dataUrl = canvas.toDataURL('image/jpeg', q);
          }
          resolve(dataUrl);
        };
        img.onerror = () => resolve(null);
        img.src = String(reader.result);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.click();
  });
}
