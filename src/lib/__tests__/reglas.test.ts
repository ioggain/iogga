// Pruebas de las reglas que YA se rompieron en producción alguna vez.
// Cada bloque nombra el error real que previene. Si alguien vuelve a
// romperlas, la publicación se detiene sola antes de llegar a la gente.
import { describe, it, expect } from 'vitest';
import {
  IOGGA_FEE_PCT, netForBusiness, ioggaFee, parsePrice,
  planEndMs, cabeEnUnDocumento, LIMITE_DOCUMENTO,
} from '../reglas';

describe('Comisión de iogga', () => {
  // ERROR REAL: el panel sumaba el precio COMPLETO de la venta como ingreso de
  // iogga, y en un lugar usaba 5% cuando el backend cobraba 10%.
  it('cobra exactamente el porcentaje configurado', () => {
    expect(ioggaFee(100)).toBe(10);
    expect(netForBusiness(100)).toBe(90);
  });

  it('el neto más la comisión SIEMPRE dan el total (nunca se pierde ni se inventa dinero)', () => {
    for (const monto of [1, 7, 33, 99, 100, 149.9, 999, 1234.56, 25000]) {
      expect(netForBusiness(monto) + ioggaFee(monto)).toBeCloseTo(monto, 2);
    }
  });

  it('nunca devuelve números negativos ni basura', () => {
    for (const malo of [0, -50, NaN, Infinity]) {
      expect(netForBusiness(malo)).toBe(0);
      expect(ioggaFee(malo)).toBe(0);
    }
  });

  it('el porcentaje del código coincide con el que se le muestra al negocio', () => {
    expect(IOGGA_FEE_PCT).toBe(10);
  });
});

describe('Lectura de precios', () => {
  it('entiende cómo escribe la gente los precios', () => {
    expect(parsePrice('$1,299.50')).toBe(1299.5);
    expect(parsePrice('199')).toBe(199);
    expect(parsePrice('$ 80 MXN')).toBe(80);
    expect(parsePrice(250)).toBe(250);
  });

  it('lo que no es un precio vale cero, no rompe', () => {
    for (const nada of ['', 'gratis', null, undefined, {}, '-5']) {
      expect(parsePrice(nada)).toBe(0);
    }
  });
});

describe('Cuándo termina un plan', () => {
  // ERROR REAL: planes que desaparecían del perfil de quien los creó.
  const dia = '2026-08-07';

  it('termina a la hora de término que se puso', () => {
    const fin = new Date(planEndMs({ date: dia, startTime: '19:00', endTime: '22:00' }));
    expect(fin.getHours()).toBe(22);
  });

  it('si no hay hora de término, usa la de inicio', () => {
    const fin = new Date(planEndMs({ date: dia, startTime: '19:00', endTime: '00:00' }));
    expect(fin.getHours()).toBe(19);
  });

  it('sin ninguna hora, dura hasta el final del día (no desaparece a media tarde)', () => {
    const fin = new Date(planEndMs({ date: dia, startTime: '00:00', endTime: '00:00' }));
    expect(fin.getHours()).toBe(23);
    expect(fin.getMinutes()).toBe(59);
  });

  it('"todo el día" llega hasta las 23:59, no a medianoche del día anterior', () => {
    const fin = new Date(planEndMs({ date: dia, allDay: true }));
    expect(fin.getHours()).toBe(23);
    expect(fin.getMinutes()).toBe(59);
  });

  it('un plan de varios días termina el ÚLTIMO día, no el primero', () => {
    const fin = planEndMs({ date: dia, endDate: '2026-08-09', endTime: '18:00' });
    expect(fin).toBeGreaterThan(planEndMs({ date: dia, endTime: '18:00' }));
  });

  it('un plan sin fecha usa el día en que se publicó (nunca queda en 1970)', () => {
    const fin = planEndMs({ timestamp: new Date('2026-08-07T10:00:00').getTime() });
    expect(fin).toBeGreaterThan(new Date('2026-08-07T00:00:00').getTime());
  });
});

describe('Tamaño de lo que se publica', () => {
  // ERROR REAL: una foto copiada de Google entraba sin comprimir, el servidor
  // rechazaba el guardado y el plan "se publicaba" sin llegar nunca.
  it('deja pasar un plan normal', () => {
    expect(cabeEnUnDocumento({ activity: 'Café', image: 'x'.repeat(300_000) })).toBe(true);
  });

  it('detiene una foto que no cabría, ANTES de intentar guardarla', () => {
    expect(cabeEnUnDocumento({ image: 'x'.repeat(LIMITE_DOCUMENTO + 1) })).toBe(false);
  });
});
