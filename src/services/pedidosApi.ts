/**
 * Service to manage authentication and order fetching from:
 * https://api-jml-production.up.railway.app/
 */

import { OrderDoc, OrderItem } from '../types';

const DEFAULT_PASSPHRASE = 'gk9c7bedbha0i76a09kc90hc2dKd695a';
const PASSPHRASE_STORAGE_KEY = 'docstock_api_passphrase';
const TOKEN_STORAGE_KEY = 'docstock_api_token';
const TOKEN_EXP_STORAGE_KEY = 'docstock_api_token_exp';

// Standard 14 days in milliseconds
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export interface PedidoApiRow {
  codigosuc?: string;
  fecha?: string;
  codigo_barra?: string;
  sku?: string;
  detalle?: string;
  salcandesp?: number;
  cantidad?: number;
  unidad?: string;
  ordendet?: number;
  ubicacion?: string;
  codigo?: string;
  codigoprin?: string;
}

export interface PedidoApiResponse {
  data: {
    exito: boolean;
    mensaje: string;
    count?: number;
    rows?: PedidoApiRow[];
    code?: string;
  };
  message: string;
}

/**
 * Obfuscation helper for sensitive local passphrase storage
 */
function secureEncode(text: string): string {
  try {
    return btoa(encodeURIComponent(text));
  } catch {
    return text;
  }
}

function secureDecode(encoded: string): string {
  try {
    return decodeURIComponent(atob(encoded));
  } catch {
    return encoded;
  }
}

export function getStoredPassphrase(): string {
  if (typeof window === 'undefined') return DEFAULT_PASSPHRASE;
  try {
    const raw = localStorage.getItem(PASSPHRASE_STORAGE_KEY);
    if (!raw) {
      saveStoredPassphrase(DEFAULT_PASSPHRASE);
      return DEFAULT_PASSPHRASE;
    }
    return secureDecode(raw) || DEFAULT_PASSPHRASE;
  } catch {
    return DEFAULT_PASSPHRASE;
  }
}

export function saveStoredPassphrase(passphrase: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PASSPHRASE_STORAGE_KEY, secureEncode(passphrase));
    // Clear token so it re-authenticates with new passphrase
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXP_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getTokenInfo(): { token: string | null; expiresAt: number | null; isExpired: boolean; daysRemaining: number } {
  if (typeof window === 'undefined') {
    return { token: null, expiresAt: null, isExpired: true, daysRemaining: 0 };
  }

  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  const expStr = localStorage.getItem(TOKEN_EXP_STORAGE_KEY);
  const exp = expStr ? parseInt(expStr, 10) : null;

  if (!token || !exp) {
    return { token: null, expiresAt: null, isExpired: true, daysRemaining: 0 };
  }

  const now = Date.now();
  const isExpired = now >= exp;
  const daysRemaining = Math.max(0, Math.round((exp - now) / (1000 * 60 * 60 * 24)));

  return { token, expiresAt: exp, isExpired, daysRemaining };
}

/**
 * Performs authentication against:
 * POST /api/logins?passphrase=...
 * Caches token for 14 days and renews automatically when needed.
 */
export async function authenticateApi(forceRefresh = false): Promise<string> {
  const current = getTokenInfo();
  // If token is still valid (not expiring within 1 hour) and not forced, return it
  if (!forceRefresh && current.token && current.expiresAt && current.expiresAt - Date.now() > 3600 * 1000) {
    return current.token;
  }

  const passphrase = getStoredPassphrase();
  const endpoints = [
    `https://api-jml-production.up.railway.app/api/logins?passphrase=${encodeURIComponent(passphrase)}`,
    `/api/remote/logins?passphrase=${encodeURIComponent(passphrase)}`,
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status} al autenticar`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Respuesta HTML inesperada en autenticación');
      }

      const data = await response.json();
      if (!data.exito || !data.token) {
        throw new Error(data.mensaje || 'Error al obtener token de autenticación');
      }

      // Calculate 14 days expiry or decode from JWT
      let expiresAt = Date.now() + FOURTEEN_DAYS_MS;
      try {
        const payloadBase64 = data.token.split('.')[1];
        if (payloadBase64) {
          const payload = JSON.parse(atob(payloadBase64));
          if (payload.exp) {
            expiresAt = payload.exp * 1000;
          }
        }
      } catch {
        // Fallback to 14 days
      }

      // Save token locally
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      localStorage.setItem(TOKEN_EXP_STORAGE_KEY, expiresAt.toString());

      return data.token;
    } catch (err) {
      lastError = err as Error;
      // Try next endpoint if available
    }
  }

  throw lastError || new Error('No se pudo conectar al servidor de autenticación');
}

/**
 * Local offline cache key for pedidos
 */
const OFFLINE_CACHE_KEY = 'docstock_offline_pedidos_v2';

export function getCachedOrder(documento: string | number): OrderDoc | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw);
    const cleanDoc = String(documento).trim().replace(/\D/g, '');
    return cache[cleanDoc] || null;
  } catch {
    return null;
  }
}

export function saveCachedOrder(documento: string | number, order: OrderDoc): void {
  if (typeof window === 'undefined') return;
  try {
    const cleanDoc = String(documento).trim().replace(/\D/g, '');
    const raw = localStorage.getItem(OFFLINE_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[cleanDoc] = order;
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage quota errors
  }
}



/**
 * Fetches pedido details by document number.
 * Endpoint: /api/pedido/:documento/001
 * Where 001 is the mandatory fixed branch indicator.
 */
export async function fetchPedido(documento: string | number): Promise<OrderDoc> {
  // Ensure document number is valid numeric string or integer
  const cleanDoc = String(documento).trim().replace(/\D/g, '');
  if (!cleanDoc) {
    throw new Error('El número de documento debe ser un valor numérico (Ej: 1, 20, 100)');
  }

  let token: string;
  try {
    token = await authenticateApi();
  } catch (authErr) {
    console.warn('API Auth failed:', authErr);
    throw new Error(
      'Error al autenticar con el servidor de pedidos (Failed to fetch). ' +
      'Esto ocurre comúnmente por bloqueo de CORS en Railway o falta de conexión en la Zebra.'
    );
  }

  const endpoints = [
    `https://api-jml-production.up.railway.app/api/pedido/${cleanDoc}/001`,
    `/api/remote/pedido/${cleanDoc}/001`,
  ];

  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // If token expired, force renew once and retry
      if (response.status === 401) {
        const renewedToken = await authenticateApi(true);
        const retryRes = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${renewedToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!retryRes.ok) {
          throw new Error(`Error HTTP ${retryRes.status} al consultar pedido`);
        }
        const dataRetry: PedidoApiResponse = await retryRes.json();
        const parsed = parsePedidoResponse(cleanDoc, dataRetry);
        saveCachedOrder(cleanDoc, parsed);
        return parsed;
      }

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status} al consultar pedido`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Respuesta HTML inesperada al consultar pedido');
      }

      const data: PedidoApiResponse = await response.json();
      const parsed = parsePedidoResponse(cleanDoc, data);
      saveCachedOrder(cleanDoc, parsed);
      return parsed;
    } catch (err) {
      lastError = err as Error;
    }
  }

  const isFailedToFetch = lastError?.message?.includes('Failed to fetch') || lastError?.name === 'TypeError';
  if (isFailedToFetch) {
    throw new Error(
      `No se pudo conectar con el servidor Railway (Failed to fetch). ` +
      `Causa: Bloqueo de CORS en la API o la Zebra no tiene salida a internet.`
    );
  }

  throw lastError || new Error(`No se pudo obtener el pedido #${cleanDoc}`);
}

export interface ConfirmarItemPayload {
  codigo: string;
  cantidad: number;
}

/**
 * Envía la confirmación de cantidades leídas de cada SKU del pedido a la API:
 * https://api-jml-production.up.railway.app/api/confirma/:documento/:sucursal
 * Cuerpo JSON: [{ "codigo": "A1", "cantidad": 2 }, ...]
 */
export async function confirmarPedido(
  documento: string | number,
  itemsPayload: ConfirmarItemPayload[],
  sucursal: string = '001'
): Promise<{ exito: boolean; mensaje: string; data?: any }> {
  const cleanDoc = String(documento).trim().replace(/\D/g, '');
  if (!cleanDoc) {
    throw new Error('No hay un número de pedido válido para confirmar.');
  }

  let token: string;
  try {
    token = await authenticateApi();
  } catch (authErr) {
    console.warn('API Auth failed on confirma:', authErr);
    throw new Error('Error al autenticar con el servidor antes de confirmar el pedido.');
  }

  const endpoints = [
    `https://api-jml-production.up.railway.app/api/confirma/${cleanDoc}/${sucursal}`,
    `/api/remote/confirma/${cleanDoc}/${sucursal}`,
  ];

  let lastError: Error | null = null;
  const bodyJson = JSON.stringify(itemsPayload);

  const parseAndValidateConfirmaResponse = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      throw new Error('El endpoint devolvió HTML en lugar de una respuesta JSON de la API.');
    }

    const rawText = await res.text();
    if (!rawText || rawText.trim().startsWith('<')) {
      throw new Error('Respuesta inválida del servidor al confirmar el pedido.');
    }

    let resData: any;
    try {
      resData = JSON.parse(rawText);
    } catch {
      throw new Error(`Respuesta no es JSON válido: ${rawText.slice(0, 100)}`);
    }

    if (resData?.exito === false || resData?.data?.exito === false) {
      throw new Error(
        resData?.data?.mensaje ||
          resData?.mensaje ||
          resData?.message ||
          'El servidor rechazó la confirmación del pedido.'
      );
    }

    return {
      exito: true,
      mensaje:
        resData?.data?.mensaje ||
        resData?.message ||
        resData?.mensaje ||
        `Pedido #${cleanDoc} confirmado correctamente en sucursal ${sucursal}.`,
      data: resData,
    };
  };

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: bodyJson,
      });

      if (response.status === 401) {
        const renewedToken = await authenticateApi(true);
        const retryRes = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${renewedToken}`,
            'Content-Type': 'application/json',
          },
          body: bodyJson,
        });
        if (!retryRes.ok) {
          const errText = await retryRes.text().catch(() => '');
          throw new Error(`Error HTTP ${retryRes.status} al confirmar pedido ${errText}`);
        }
        return await parseAndValidateConfirmaResponse(retryRes);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`Error HTTP ${response.status} al confirmar pedido ${errText}`);
      }

      return await parseAndValidateConfirmaResponse(response);
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError || new Error(`No se pudo enviar la confirmación del pedido #${cleanDoc}`);
}

/**
 * Obtiene la clave de autorización para saltar/continuar con el siguiente ítem
 * sin haber completado la validación del código en curso.
 * Endpoint: https://api-jml-production.up.railway.app/api/loadpassalto
 */
export async function fetchPassAlto(): Promise<string> {
  let token: string;
  try {
    token = await authenticateApi();
  } catch (authErr) {
    console.warn('API Auth failed on loadpassalto:', authErr);
    throw new Error('Error al autenticar con el servidor para validar la clave.');
  }

  const endpoints = [
    `https://api-jml-production.up.railway.app/api/loadpassalto`,
    `/api/remote/loadpassalto`,
  ];

  let lastError: Error | null = null;

  const extractPassFromResponse = (resData: any): string => {
    const val =
      resData?.data?.rows?.[0]?.valortext ??
      resData?.data?.rows?.[0]?.valor ??
      resData?.data?.rows?.[0]?.clave ??
      resData?.data?.valortext ??
      resData?.data?.clave ??
      resData?.rows?.[0]?.valortext ??
      resData?.valortext ??
      resData?.clave;

    if (val !== undefined && val !== null && String(val).trim() !== '') {
      return String(val).trim();
    }
    throw new Error(resData?.data?.mensaje || 'No se encontró la clave de autorización en el servidor.');
  };

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        const renewedToken = await authenticateApi(true);
        const retryRes = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${renewedToken}`,
            'Content-Type': 'application/json',
          },
        });
        if (!retryRes.ok) {
          throw new Error(`Error HTTP ${retryRes.status} al consultar clave de autorización`);
        }
        const retryData = await retryRes.json();
        return extractPassFromResponse(retryData);
      }

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status} al consultar clave de autorización`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Respuesta HTML inesperada al consultar clave');
      }

      const resData = await response.json();
      return extractPassFromResponse(resData);
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError || new Error('No se pudo conectar al servidor para verificar la clave de autorización');
}

function parsePedidoResponse(documento: string, apiRes: PedidoApiResponse): OrderDoc {
  if (!apiRes.data || !apiRes.data.exito) {
    throw new Error(apiRes.data?.mensaje || 'El documento no fue encontrado en el servidor');
  }

  const rows = apiRes.data.rows || [];
  if (rows.length === 0) {
    throw new Error(`El pedido #${documento} no contiene ítems registrados (0 ítems)`);
  }

  let totalQty = 0;
  const items: OrderItem[] = rows.map((row, index) => {
    // Map fields according to specification:
    // - SKU: tag 'sku'
    const cleanSku = (row.sku || row.codigo || row.codigoprin || `SKU-${index + 1}`).trim();

    // - Código de barra: tag 'codigo_barra'
    const cleanBarcode = (row.codigo_barra || row.codigoprin || row.codigo || cleanSku).trim();

    // - Descripción: tag 'detalle'
    const baseDesc = (row.detalle || 'Sin descripción').trim().replace(/\s+/g, ' ');
    const cleanUnit = (row.unidad || '').trim();
    const cleanDesc = cleanUnit ? `${baseDesc} (${cleanUnit})` : baseDesc;

    // - Cantidad a validar: tag 'salcandesp' (o 'cantidad' si salcandesp viene en 0)
    const rawSalcan = row.salcandesp !== undefined && row.salcandesp !== null ? Number(row.salcandesp) : 0;
    const rawCant = row.cantidad !== undefined && row.cantidad !== null ? Number(row.cantidad) : 0;
    const qty = rawSalcan > 0 ? rawSalcan : (rawCant > 0 ? rawCant : 1);

    totalQty += qty;

    // Ubicación de bodega si viene en el tag ubicacion o asignación estándar
    const cleanUbicacion = (row.ubicacion || '').trim();
    const bayNumber = String((index % 8) + 1).padStart(2, '0');
    const shelfLetter = String.fromCharCode(65 + (index % 4));
    const location = cleanUbicacion || `P-${bayNumber}-${shelfLetter}`;

    return {
      sku: cleanSku,
      description: cleanDesc,
      location,
      expectedQty: qty,
      countedQty: 0,
      symbology: 'EAN-13',
      status: qty === 0 ? 'ok' : 'pending',
      barcode: cleanBarcode,
      notes: `Línea ${row.ordendet || index + 1} • Sucursal ${row.codigosuc || '001'}${row.cantidad !== undefined ? ` • Cant. original: ${row.cantidad}` : ''}`,
    };
  });

  const formattedDate = rows[0]?.fecha
    ? new Date(rows[0].fecha).toLocaleDateString()
    : new Date().toLocaleDateString();

  return {
    id: `PED-${documento}`,
    name: `Pedido #${documento} (Suc. 001)`,
    type: 'Auditoría de Despacho',
    warehouse: 'Bodega Central - Andén 1',
    bay: 'Bahía 01',
    status: 'auditando',
    operator: 'Javier Escobar',
    startedAt: formattedDate,
    totalExpected: totalQty,
    items,
  };
}
