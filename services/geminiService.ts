import { Scenario, AlarmEvent } from "../types";

const deviceTypes = [
  "Smoke Detector",
  "Heat Detector",
  "Manual Call Point",
  "Beam Detector",
  "Duct Detector",
  "Ionisation Detector",
  "Multi-Sensor",
  "Flame Detector"
];

const locations = [
  "Ground Floor Lobby",
  "Level 2 East Corridor",
  "Level 3 West Wing",
  "Level 4 Server Room",
  "Level 5 Office Area",
  "Basement Car Park",
  "Stairwell A",
  "Stairwell B",
  "Kitchen Area",
  "Storage Room",
  "Conference Room 1",
  "Conference Room 2",
  "Electrical Room",
  "Plant Room",
  "Roof Access",
  "Loading Bay",
  "Reception Area",
  "Break Room",
  "Archive Storage",
  "IT Equipment Room"
];

const scenarioTemplates = [
  {
    title: "Kitchen Fire Alarm",
    description: "Cooking activity has triggered smoke detectors in the kitchen area.",
    eventCount: 1,
    statusType: 'FIRE' as const,
    persistent: false
  },
  {
    title: "Electrical Room Fault",
    description: "Dust accumulation causing persistent detector fault in electrical room.",
    eventCount: 1,
    statusType: 'FAULT' as const,
    persistent: true
  },
  {
    title: "Multi-Zone Fire Event",
    description: "Fire spreading across multiple zones requiring immediate response.",
    eventCount: 3,
    statusType: 'FIRE' as const,
    persistent: false
  },
  {
    title: "Server Room Heat Detection",
    description: "Elevated temperatures detected in server room equipment area.",
    eventCount: 2,
    statusType: 'FIRE' as const,
    persistent: false
  },
  {
    title: "Car Park Detector Malfunction",
    description: "Multiple detector faults in basement car park due to moisture.",
    eventCount: 2,
    statusType: 'FAULT' as const,
    persistent: true
  },
  {
    title: "Mixed Event Scenario",
    description: "Combination of fire alarm and equipment fault requiring isolation.",
    eventCount: 3,
    statusType: 'MIXED' as const,
    persistent: true
  },
  {
    title: "Manual Call Point Activation",
    description: "Manual call point activated in corridor area.",
    eventCount: 1,
    statusType: 'FIRE' as const,
    persistent: false
  },
  {
    title: "Building-Wide System Check",
    description: "Multiple zones reporting for verification and response drill.",
    eventCount: 4,
    statusType: 'MIXED' as const,
    persistent: false
  }
];

const getRandomElement = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

const generateEvent = (index: number, statusType: 'FIRE' | 'FAULT' | 'MIXED', isPersistent: boolean): AlarmEvent => {
  const zone = Math.floor(Math.random() * 32) + 1;
  const status = statusType === 'MIXED'
    ? (Math.random() > 0.5 ? 'FIRE' : 'FAULT')
    : statusType;

  const persistent = statusType === 'MIXED'
    ? (status === 'FAULT' || Math.random() > 0.6)
    : isPersistent;

  return {
    id: `event-${Date.now()}-${index}`,
    zone,
    loop: 0, // Will be enriched in App.tsx
    device: 0, // Will be enriched in App.tsx
    deviceType: getRandomElement(deviceTypes),
    location: getRandomElement(locations),
    timestamp: new Date().toISOString(),
    status,
    isPersistent: persistent
  };
};

export const generateFireScenario = async (): Promise<Scenario> => {
  // Simulate slight delay to make it feel realistic
  await new Promise(resolve => setTimeout(resolve, 300));

  const template = getRandomElement(scenarioTemplates);

  const events: AlarmEvent[] = [];
  for (let i = 0; i < template.eventCount; i++) {
    events.push(generateEvent(i, template.statusType, template.persistent));
  }

  return {
    title: template.title,
    description: template.description,
    events
  };
};
