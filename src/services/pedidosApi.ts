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
    `/api/remote/logins?passphrase=${encodeURIComponent(passphrase)}`,
    `https://api-jml-production.up.railway.app/api/logins?passphrase=${encodeURIComponent(passphrase)}`,
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

  const token = await authenticateApi();
  const endpoints = [
    `/api/remote/pedido/${cleanDoc}/001`,
    `https://api-jml-production.up.railway.app/api/pedido/${cleanDoc}/001`,
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
        return parsePedidoResponse(cleanDoc, dataRetry);
      }

      if (!response.ok) {
        throw new Error(`Error HTTP ${response.status} al consultar pedido`);
      }

      const data: PedidoApiResponse = await response.json();
      return parsePedidoResponse(cleanDoc, data);
    } catch (err) {
      lastError = err as Error;
    }
  }

  throw lastError || new Error(`No se pudo obtener el pedido #${cleanDoc}`);
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

    // - Cantidad a validar: tag 'salcandesp'
    const qty = row.salcandesp !== undefined && row.salcandesp !== null
      ? Number(row.salcandesp)
      : (row.cantidad !== undefined && row.cantidad !== null ? Number(row.cantidad) : 0);

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
      symbology: cleanBarcode.length >= 12 ? 'EAN-128' : 'Code 128',
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
