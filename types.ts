
export enum PanelStatus {
  NORMAL = 'NORMAL',
  FIRE = 'FIRE',
  FAULT = 'FAULT',
  ISOLATED = 'ISOLATED'
}

export type InputMode = 'NONE' | 'ZONE' | 'DEVICE' | 'LOOP' | 'DISABLE_SELECT';
export type AppView = 'HOME' | 'FIREFINDER_PLUS' | 'PERTRONIC_F220' | 'ZONESENSE_PLUS';

export interface AlarmEvent {
  id: string;
  zone: number;
  loop: number;
  device: number;
  deviceType: string;
  location: string;
  timestamp: string;
  status: 'FIRE' | 'FAULT';
  isPersistent?: boolean; // If true, requires isolation to clear
}

export interface TrainingStats {
  score: number;
  startTime: number | null;
  actions: string[];
  lastResult: {
    score: number;
    rank: string;
    feedback: string;
  } | null;
}

export interface PanelState {
  alarms: AlarmEvent[];
  isolatedZones: number[];
  buzzerSilenced: boolean;
  alarmsSilenced: boolean;
  currentDisplayIndex: number;
  isTesting: boolean;
  isResetting: boolean;
  powerStatus: 'OK' | 'FAULT';
  systemStatus: 'OK' | 'FAULT';
  numericInput: string;
  inputTarget: InputMode;
  menuVisible: boolean;
  selectedZoneForDisable?: number;
  training: TrainingStats;
}

export interface Scenario {
  title: string;
  description: string;
  events: AlarmEvent[];
}
