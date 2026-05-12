export interface ShapeDefinition {
  id: string;
  name: string;
  description: string;
  paths: Array<{
    d: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: string;
    opacity?: number;
    transform?: string;
  }>;
}

export const shapes: ShapeDefinition[] = [
  {
    id: 'parallel-lines',
    name: 'Parallel Lines',
    description: 'Bold diagonal lines',
    paths: [
      {
        d: 'M -600 0 L 3160 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '6',
        opacity: 0.6,
      },
      {
        d: 'M -400 0 L 3360 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '6',
        opacity: 0.55,
      },
      {
        d: 'M -200 0 L 3560 1920',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '6',
        opacity: 0.5,
      },
      {
        d: 'M 0 0 L 3760 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '6',
        opacity: 0.55,
      },
      {
        d: 'M 200 0 L 3960 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '6',
        opacity: 0.5,
      },
      {
        d: 'M 400 0 L 4160 1920',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '6',
        opacity: 0.45,
      },
      {
        d: 'M 600 0 L 4360 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '6',
        opacity: 0.5,
      },
      {
        d: 'M 800 0 L 4560 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '6',
        opacity: 0.45,
      },
      {
        d: 'M 1000 0 L 4760 1920',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '6',
        opacity: 0.5,
      },
      {
        d: 'M 1200 0 L 4960 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '6',
        opacity: 0.45,
      },
    ],
  },
  {
    id: 'diagonal-stripes',
    name: 'Diagonal Stripes',
    description: 'Bold diagonal pattern',
    paths: [
      {
        d: 'M 0 0 L 2560 1920 M -320 0 L 2240 1920 M -640 0 L 1920 1920 M -960 0 L 1600 1920 M -1280 0 L 1280 1920 M -1600 0 L 960 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '200',
        opacity: 0.5,
      },
      {
        d: 'M 320 0 L 2880 1920 M 0 0 L 2560 1920 M -320 0 L 2240 1920 M -640 0 L 1920 1920 M -960 0 L 1600 1920 M -1280 0 L 1280 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '200',
        opacity: 0.45,
      },
    ],
  },
  {
    id: 'horizontal-lines',
    name: 'Horizontal Lines',
    description: 'Bold horizontal stripes',
    paths: [
      {
        d: 'M 0 120 L 2560 120',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.6,
      },
      {
        d: 'M 0 240 L 2560 240',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 0 360 L 2560 360',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 0 480 L 2560 480',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 0 600 L 2560 600',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 0 720 L 2560 720',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 0 840 L 2560 840',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 0 960 L 2560 960',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 0 1080 L 2560 1080',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 0 1200 L 2560 1200',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 0 1320 L 2560 1320',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 0 1440 L 2560 1440',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 0 1560 L 2560 1560',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 0 1680 L 2560 1680',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 0 1800 L 2560 1800',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.5,
      },
    ],
  },
  {
    id: 'vertical-lines',
    name: 'Vertical Lines',
    description: 'Bold vertical stripes',
    paths: [
      {
        d: 'M 160 0 L 160 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.6,
      },
      {
        d: 'M 320 0 L 320 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 480 0 L 480 1920',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 640 0 L 640 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 800 0 L 800 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 960 0 L 960 1920',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 1120 0 L 1120 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 1280 0 L 1280 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 1440 0 L 1440 1920',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 1600 0 L 1600 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 1760 0 L 1760 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 1920 0 L 1920 1920',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 2080 0 L 2080 1920',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '5',
        opacity: 0.5,
      },
      {
        d: 'M 2240 0 L 2240 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '5',
        opacity: 0.55,
      },
      {
        d: 'M 2400 0 L 2400 1920',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '5',
        opacity: 0.5,
      },
    ],
  },
  {
    id: 'grid-pattern',
    name: 'Grid Pattern',
    description: 'Bold grid design',
    paths: [
      {
        d: 'M 0 120 L 2560 120 M 0 240 L 2560 240 M 0 360 L 2560 360 M 0 480 L 2560 480 M 0 600 L 2560 600 M 0 720 L 2560 720 M 0 840 L 2560 840 M 0 960 L 2560 960 M 0 1080 L 2560 1080 M 0 1200 L 2560 1200 M 0 1320 L 2560 1320 M 0 1440 L 2560 1440 M 0 1560 L 2560 1560 M 0 1680 L 2560 1680 M 0 1800 L 2560 1800',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '3',
        opacity: 0.5,
      },
      {
        d: 'M 160 0 L 160 1920 M 320 0 L 320 1920 M 480 0 L 480 1920 M 640 0 L 640 1920 M 800 0 L 800 1920 M 960 0 L 960 1920 M 1120 0 L 1120 1920 M 1280 0 L 1280 1920 M 1440 0 L 1440 1920 M 1600 0 L 1600 1920 M 1760 0 L 1760 1920 M 1920 0 L 1920 1920 M 2080 0 L 2080 1920 M 2240 0 L 2240 1920 M 2400 0 L 2400 1920',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '3',
        opacity: 0.45,
      },
    ],
  },
  {
    id: 'dots-pattern',
    name: 'Dots Pattern',
    description: 'Bold dot grid',
    paths: [
      {
        d: 'M 160 120 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-1)',
        opacity: 0.6,
      },
      {
        d: 'M 320 240 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-2)',
        opacity: 0.55,
      },
      {
        d: 'M 480 360 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-3)',
        opacity: 0.5,
      },
      {
        d: 'M 640 480 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-1)',
        opacity: 0.55,
      },
      {
        d: 'M 800 600 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-2)',
        opacity: 0.5,
      },
      {
        d: 'M 960 720 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-3)',
        opacity: 0.55,
      },
      {
        d: 'M 1120 840 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-1)',
        opacity: 0.5,
      },
      {
        d: 'M 1280 960 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-2)',
        opacity: 0.55,
      },
      {
        d: 'M 1440 1080 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-3)',
        opacity: 0.5,
      },
      {
        d: 'M 1600 1200 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-1)',
        opacity: 0.55,
      },
      {
        d: 'M 1760 1320 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-2)',
        opacity: 0.5,
      },
      {
        d: 'M 1920 1440 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-3)',
        opacity: 0.55,
      },
      {
        d: 'M 2080 1560 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-1)',
        opacity: 0.5,
      },
      {
        d: 'M 2240 1680 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-2)',
        opacity: 0.55,
      },
      {
        d: 'M 2400 1800 m -16 0 a 16 16 0 1 0 32 0 a 16 16 0 1 0 -32 0',
        fill: 'var(--color-background-image-accent-3)',
        opacity: 0.5,
      },
    ],
  },
  {
    id: 'wave-lines',
    name: 'Wave Lines',
    description: 'Bold flowing waves',
    paths: [
      {
        d: 'M 0 240 Q 320 120 640 240 T 1280 240 T 1920 240 T 2560 240',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '8',
        opacity: 0.6,
        fill: 'none',
      },
      {
        d: 'M 0 480 Q 320 360 640 480 T 1280 480 T 1920 480 T 2560 480',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '8',
        opacity: 0.55,
        fill: 'none',
      },
      {
        d: 'M 0 720 Q 320 600 640 720 T 1280 720 T 1920 720 T 2560 720',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '8',
        opacity: 0.5,
        fill: 'none',
      },
      {
        d: 'M 0 960 Q 320 840 640 960 T 1280 960 T 1920 960 T 2560 960',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '8',
        opacity: 0.55,
        fill: 'none',
      },
      {
        d: 'M 0 1200 Q 320 1080 640 1200 T 1280 1200 T 1920 1200 T 2560 1200',
        stroke: 'var(--color-background-image-accent-2)',
        strokeWidth: '8',
        opacity: 0.5,
        fill: 'none',
      },
      {
        d: 'M 0 1440 Q 320 1320 640 1440 T 1280 1440 T 1920 1440 T 2560 1440',
        stroke: 'var(--color-background-image-accent-3)',
        strokeWidth: '8',
        opacity: 0.55,
        fill: 'none',
      },
      {
        d: 'M 0 1680 Q 320 1560 640 1680 T 1280 1680 T 1920 1680 T 2560 1680',
        stroke: 'var(--color-background-image-accent-1)',
        strokeWidth: '8',
        opacity: 0.5,
        fill: 'none',
      },
    ],
  },
];

export function getShapeById(id: string): ShapeDefinition {
  return shapes.find((shape) => shape.id === id) || shapes[0];
}



