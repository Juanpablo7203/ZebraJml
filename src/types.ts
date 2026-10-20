export interface OrderItem {
  sku: string;
  description: string;
  location: string;
  expectedQty: number;
  countedQty: number;
  symbology: string;
  status: 'ok' | 'discrepancy' | 'pending';
  barcode: string;
  lastScannedAt?: string;
  notes?: string;
}

export interface OrderDoc {
  id: string;
  name: string;
  type: string;
  warehouse: string;
  bay: string;
  status: 'auditando' | 'completada' | 'pausada';
  items: OrderItem[];
  operator: string;
  startedAt: string;
  totalExpected: number;
}

export interface ScanLog {
  id: string;
  timestamp: string;
  sku: string;
  description: string;
  symbology: string;
  quantityDelta: number;
  totalCounted: number;
  expectedQty: number;
  method: 'hardware_trigger' | 'soft_trigger' | 'camera' | 'dialpad';
  status: 'success' | 'warning' | 'error';
}

export interface ScannerSettings {
  bipEnabled: boolean;
  hapticEnabled: boolean;
  bipVolume: number;
  bipFrequency: number;
  aimingBeam: 'dot' | 'crosshair' | 'reticle';
  illumination: number;
  multiScanMode: boolean;
  datawedgeProfile: string;
  intentOutput: boolean;
  symbologies: {
    ean128: boolean;
    code128: boolean;
    qrCode: boolean;
    dataMatrix: boolean;
    gs1Databar: boolean;
    pdf417: boolean;
    code39: boolean;
  };
}
