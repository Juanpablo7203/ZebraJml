import { OrderDoc, ScanLog, ScannerSettings } from '../types';

export const INITIAL_ORDERS: OrderDoc[] = [];

export const INITIAL_SCAN_LOGS: ScanLog[] = [];

export const DEFAULT_SETTINGS: ScannerSettings = {
  bipEnabled: true,
  hapticEnabled: true,
  bipVolume: 85,
  bipFrequency: 1850,
  aimingBeam: 'dot',
  illumination: 8,
  multiScanMode: true,
  datawedgeProfile: 'DocStock_Default_v11.4',
  intentOutput: true,
  symbologies: {
    ean13: true,
    ean128: true,
    code128: true,
    qrCode: true,
    dataMatrix: true,
    gs1Databar: true,
    pdf417: true,
    code39: true,
  },
};
