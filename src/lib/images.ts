// Subida real de fotos, sin servidores extra: la foto se comprime en el
// teléfono y se guarda como texto (base64) en Firestore. Módulo independiente
// para poder cambiarlo por Firebase Storage u otro servicio en el futuro.

// Comprime CUALQUIER imagen (venga de la galería, de la cámara o del
// portapapeles) al mismo tamaño y peso. Es la ÚNICA puerta de entrada de fotos
// a la app: así ninguna foto puede pasar sin encoger. Antes, una imagen copiada
// de Google entraba tal cual (varios MB) y luego el guardado se rechazaba en
// silencio: el plan parecía publicado pero nunca llegaba.
export function compressDataUrl(dataUrl: string, maxSide = 900, quality = 0.72): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
          let out = canvas.toDataURL('image/jpeg', quality);
          // Tope duro: un documento no aguanta más de ~1 MB, así que si sigue
          // pesando se vuelve a comprimir hasta que quepa.
          let q = quality;
          while (out.length > 700_000 && q > 0.3) {
            q -= 0.15;
            out = canvas.toDataURL('image/jpeg', q);
          }
          resolve(out.length > 900_000 ? null : out);
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.crossOrigin = 'anonymous';
      img.src = dataUrl;
    } catch {
      resolve(null);
    }
  });
}

export function pickImage(maxSide = 900, quality = 0.72): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // iOS Safari ignora el clic si el input no está en el documento
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    document.body.appendChild(input);
    const cleanup = () => input.remove();
    input.onchange = () => {
      const file = input.files?.[0];
      cleanup();
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
