export interface BackgroundDefinition {
  id: string;
  name: string;
  description: string;
  cssVariables: Record<string, string>;
  svgPaths: Array<{
    d: string;
    fill: string;
  }>;
}

export const backgrounds: BackgroundDefinition[] = [
  {
    id: 'default',
    name: 'Default Green',
    description: 'Classic green and teal gradient',
    cssVariables: {
      '--color-background-image-base': 'var(--gray-1)',
      '--color-background-image-accent-1': 'var(--green-a7)',
      '--color-background-image-accent-2': 'var(--teal-6)',
      '--color-background-image-accent-3': 'var(--green-9)',
      '--color-background-image-accent-4': 'var(--cyan-5)',
      '--color-background-image-accent-5': 'var(--slate-1)',
      '--color-background-image-accent-6': 'var(--mint-a5)',
      '--color-background-image-accent-7': 'var(--teal-5)',
    },
    svgPaths: [
      {
        d: 'M3020.93 134.455C3124.79 173.824 3164.97 266.778 3110.66 342.074C2627.55 1011.9 1866.31 2517.63 1361.75 2752.01C-681.389 3429.21 -4156.79 2571.47 -2138.3 1425.38C-119.809 279.282 -1553.39 -218.348 -406.211 -990.94C930.008 -1890.85 2560.5 -40.0647 3020.93 134.455Z',
        fill: 'url(#paint0_radial_default)',
      },
      {
        d: 'M885.9 -99.2149L1864.74 271.797C1921.14 293.178 1961.34 331.784 1974.23 376.971L2135.2 941.153L2866.18 715.05C2924.72 696.941 2991.39 698.838 3047.8 720.218L4026.64 1091.23C4130.5 1130.6 4170.68 1223.55 4116.37 1298.85L3855.77 1660.16C3833.07 1691.63 3796.05 1716.44 3750.99 1730.38L2473.16 2125.63L2754.29 3110.94C2764.38 3146.29 2756.99 3183.09 2733.43 3214.9L2367.46 3708.79L1208.97 3269.68C1152.56 3248.3 1112.37 3209.7 1099.48 3164.51C816.824 2173.87 718.627 2080.16 290.681 580.294C250.811 440.558 316.198 358.62 338.898 327.148L599.499 -34.1638C653.807 -109.46 782.033 -138.584 885.9 -99.2149Z',
        fill: 'url(#paint1_radial_default)',
      },
      {
        d: 'M1597.13 169.785L2575.97 540.797C2632.38 562.177 2672.57 600.783 2685.46 645.97L2846.44 1210.15L3577.41 984.05C3635.96 965.94 3702.63 967.838 3759.03 989.218L4737.87 1360.23C4841.74 1399.6 4881.91 1492.55 4827.6 1567.85L4567 1929.16C4544.3 1960.63 4507.28 1985.44 4462.22 1999.38L3184.4 2394.63L3465.53 3379.94C3475.61 3415.29 3468.23 3452.09 3444.66 3483.9L3078.69 3977.79L1920.2 3538.68C1863.79 3517.3 1823.6 3478.7 1810.71 3433.51L1649.74 2869.33L918.759 3095.43C860.213 3113.54 793.545 3111.64 737.138 3090.26C737.138 3090.26 -278.857 2706.76 -70.6873 2151.46C137.482 1596.17 725.315 1866.25 1311.78 1684.85L1030.38 698.594C1020.45 663.816 1027.43 627.62 1050.13 596.148L1310.73 234.836C1365.04 159.54 1493.27 130.416 1597.13 169.785Z',
        fill: 'url(#paint2_radial_default)',
      },
    ],
  },
  {
    id: 'blue-ocean',
    name: 'Blue Ocean',
    description: 'Calming blue gradient waves',
    cssVariables: {
      '--color-background-image-base': 'var(--slate-1)',
      '--color-background-image-accent-1': 'var(--blue-a7)',
      '--color-background-image-accent-2': 'var(--cyan-6)',
      '--color-background-image-accent-3': 'var(--blue-9)',
      '--color-background-image-accent-4': 'var(--sky-5)',
      '--color-background-image-accent-5': 'var(--slate-2)',
      '--color-background-image-accent-6': 'var(--blue-a5)',
      '--color-background-image-accent-7': 'var(--cyan-5)',
    },
    svgPaths: [
      {
        d: 'M3020.93 134.455C3124.79 173.824 3164.97 266.778 3110.66 342.074C2627.55 1011.9 1866.31 2517.63 1361.75 2752.01C-681.389 3429.21 -4156.79 2571.47 -2138.3 1425.38C-119.809 279.282 -1553.39 -218.348 -406.211 -990.94C930.008 -1890.85 2560.5 -40.0647 3020.93 134.455Z',
        fill: 'url(#paint0_radial_blue)',
      },
      {
        d: 'M885.9 -99.2149L1864.74 271.797C1921.14 293.178 1961.34 331.784 1974.23 376.971L2135.2 941.153L2866.18 715.05C2924.72 696.941 2991.39 698.838 3047.8 720.218L4026.64 1091.23C4130.5 1130.6 4170.68 1223.55 4116.37 1298.85L3855.77 1660.16C3833.07 1691.63 3796.05 1716.44 3750.99 1730.38L2473.16 2125.63L2754.29 3110.94C2764.38 3146.29 2756.99 3183.09 2733.43 3214.9L2367.46 3708.79L1208.97 3269.68C1152.56 3248.3 1112.37 3209.7 1099.48 3164.51C816.824 2173.87 718.627 2080.16 290.681 580.294C250.811 440.558 316.198 358.62 338.898 327.148L599.499 -34.1638C653.807 -109.46 782.033 -138.584 885.9 -99.2149Z',
        fill: 'url(#paint1_radial_blue)',
      },
    ],
  },
  {
    id: 'purple-sunset',
    name: 'Purple Sunset',
    description: 'Vibrant purple and pink gradient',
    cssVariables: {
      '--color-background-image-base': 'var(--slate-1)',
      '--color-background-image-accent-1': 'var(--purple-a7)',
      '--color-background-image-accent-2': 'var(--violet-6)',
      '--color-background-image-accent-3': 'var(--purple-9)',
      '--color-background-image-accent-4': 'var(--plum-5)',
      '--color-background-image-accent-5': 'var(--slate-2)',
      '--color-background-image-accent-6': 'var(--purple-a5)',
      '--color-background-image-accent-7': 'var(--violet-5)',
    },
    svgPaths: [
      {
        d: 'M3020.93 134.455C3124.79 173.824 3164.97 266.778 3110.66 342.074C2627.55 1011.9 1866.31 2517.63 1361.75 2752.01C-681.389 3429.21 -4156.79 2571.47 -2138.3 1425.38C-119.809 279.282 -1553.39 -218.348 -406.211 -990.94C930.008 -1890.85 2560.5 -40.0647 3020.93 134.455Z',
        fill: 'url(#paint0_radial_purple)',
      },
      {
        d: 'M885.9 -99.2149L1864.74 271.797C1921.14 293.178 1961.34 331.784 1974.23 376.971L2135.2 941.153L2866.18 715.05C2924.72 696.941 2991.39 698.838 3047.8 720.218L4026.64 1091.23C4130.5 1130.6 4170.68 1223.55 4116.37 1298.85L3855.77 1660.16C3833.07 1691.63 3796.05 1716.44 3750.99 1730.38L2473.16 2125.63L2754.29 3110.94C2764.38 3146.29 2756.99 3183.09 2733.43 3214.9L2367.46 3708.79L1208.97 3269.68C1152.56 3248.3 1112.37 3209.7 1099.48 3164.51C816.824 2173.87 718.627 2080.16 290.681 580.294C250.811 440.558 316.198 358.62 338.898 327.148L599.499 -34.1638C653.807 -109.46 782.033 -138.584 885.9 -99.2149Z',
        fill: 'url(#paint1_radial_purple)',
      },
    ],
  },
  {
    id: 'warm-sunrise',
    name: 'Warm Sunrise',
    description: 'Warm orange and yellow tones',
    cssVariables: {
      '--color-background-image-base': 'var(--orange-1)',
      '--color-background-image-accent-1': 'var(--orange-a7)',
      '--color-background-image-accent-2': 'var(--amber-6)',
      '--color-background-image-accent-3': 'var(--orange-9)',
      '--color-background-image-accent-4': 'var(--yellow-5)',
      '--color-background-image-accent-5': 'var(--orange-2)',
      '--color-background-image-accent-6': 'var(--orange-a5)',
      '--color-background-image-accent-7': 'var(--amber-5)',
    },
    svgPaths: [
      {
        d: 'M3020.93 134.455C3124.79 173.824 3164.97 266.778 3110.66 342.074C2627.55 1011.9 1866.31 2517.63 1361.75 2752.01C-681.389 3429.21 -4156.79 2571.47 -2138.3 1425.38C-119.809 279.282 -1553.39 -218.348 -406.211 -990.94C930.008 -1890.85 2560.5 -40.0647 3020.93 134.455Z',
        fill: 'url(#paint0_radial_warm)',
      },
      {
        d: 'M885.9 -99.2149L1864.74 271.797C1921.14 293.178 1961.34 331.784 1974.23 376.971L2135.2 941.153L2866.18 715.05C2924.72 696.941 2991.39 698.838 3047.8 720.218L4026.64 1091.23C4130.5 1130.6 4170.68 1223.55 4116.37 1298.85L3855.77 1660.16C3833.07 1691.63 3796.05 1716.44 3750.99 1730.38L2473.16 2125.63L2754.29 3110.94C2764.38 3146.29 2756.99 3183.09 2733.43 3214.9L2367.46 3708.79L1208.97 3269.68C1152.56 3248.3 1112.37 3209.7 1099.48 3164.51C816.824 2173.87 718.627 2080.16 290.681 580.294C250.811 440.558 316.198 358.62 338.898 327.148L599.499 -34.1638C653.807 -109.46 782.033 -138.584 885.9 -99.2149Z',
        fill: 'url(#paint1_radial_warm)',
      },
    ],
  },
  {
    id: 'cool-mint',
    name: 'Cool Mint',
    description: 'Fresh mint and cyan gradient',
    cssVariables: {
      '--color-background-image-base': 'var(--mint-1)',
      '--color-background-image-accent-1': 'var(--mint-a7)',
      '--color-background-image-accent-2': 'var(--cyan-6)',
      '--color-background-image-accent-3': 'var(--mint-9)',
      '--color-background-image-accent-4': 'var(--teal-5)',
      '--color-background-image-accent-5': 'var(--mint-2)',
      '--color-background-image-accent-6': 'var(--mint-a5)',
      '--color-background-image-accent-7': 'var(--cyan-5)',
    },
    svgPaths: [
      {
        d: 'M3020.93 134.455C3124.79 173.824 3164.97 266.778 3110.66 342.074C2627.55 1011.9 1866.31 2517.63 1361.75 2752.01C-681.389 3429.21 -4156.79 2571.47 -2138.3 1425.38C-119.809 279.282 -1553.39 -218.348 -406.211 -990.94C930.008 -1890.85 2560.5 -40.0647 3020.93 134.455Z',
        fill: 'url(#paint0_radial_mint)',
      },
      {
        d: 'M885.9 -99.2149L1864.74 271.797C1921.14 293.178 1961.34 331.784 1974.23 376.971L2135.2 941.153L2866.18 715.05C2924.72 696.941 2991.39 698.838 3047.8 720.218L4026.64 1091.23C4130.5 1130.6 4170.68 1223.55 4116.37 1298.85L3855.77 1660.16C3833.07 1691.63 3796.05 1716.44 3750.99 1730.38L2473.16 2125.63L2754.29 3110.94C2764.38 3146.29 2756.99 3183.09 2733.43 3214.9L2367.46 3708.79L1208.97 3269.68C1152.56 3248.3 1112.37 3209.7 1099.48 3164.51C816.824 2173.87 718.627 2080.16 290.681 580.294C250.811 440.558 316.198 358.62 338.898 327.148L599.499 -34.1638C653.807 -109.46 782.033 -138.584 885.9 -99.2149Z',
        fill: 'url(#paint1_radial_mint)',
      },
    ],
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    description: 'Subtle gray gradient',
    cssVariables: {
      '--color-background-image-base': 'var(--gray-1)',
      '--color-background-image-accent-1': 'var(--gray-a7)',
      '--color-background-image-accent-2': 'var(--slate-6)',
      '--color-background-image-accent-3': 'var(--gray-9)',
      '--color-background-image-accent-4': 'var(--slate-5)',
      '--color-background-image-accent-5': 'var(--gray-2)',
      '--color-background-image-accent-6': 'var(--gray-a5)',
      '--color-background-image-accent-7': 'var(--slate-5)',
    },
    svgPaths: [
      {
        d: 'M3020.93 134.455C3124.79 173.824 3164.97 266.778 3110.66 342.074C2627.55 1011.9 1866.31 2517.63 1361.75 2752.01C-681.389 3429.21 -4156.79 2571.47 -2138.3 1425.38C-119.809 279.282 -1553.39 -218.348 -406.211 -990.94C930.008 -1890.85 2560.5 -40.0647 3020.93 134.455Z',
        fill: 'url(#paint0_radial_gray)',
      },
    ],
  },
];

export function getBackgroundById(id: string): BackgroundDefinition {
  return backgrounds.find((bg) => bg.id === id) || backgrounds[0];
}

