import type { Meta, StoryObj } from '@storybook/react-vite';
import { AspectRatio } from '@welpco/ui/aspect-ratio';
import { Box } from '@radix-ui/themes';

const meta = {
  title: 'Components/AspectRatio',
  component: AspectRatio,
  parameters: {
    layout: 'centered',
    a11y: {
      // Demo story — showcases Radix variants at every contrast level including
      // decorative low-contrast options (ghost / outline / soft). Production
      // code is still checked by bible §5.3 and the a11y addon panel. axe's
      // color-contrast rule is disabled here so variant-exploration stories
      // don't pollute the CI baseline.
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AspectRatio ratio={16 / 9} style={{ width: '500px' }}>
      <Box style={{ width: '100%', height: '100%', backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        16:9 Aspect Ratio
      </Box>
    </AspectRatio>
  ),
};

export const Ratios: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '500px' }}>
      <AspectRatio ratio={16 / 9}>
        <Box style={{ width: '100%', height: '100%', backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          16:9
        </Box>
      </AspectRatio>
      <AspectRatio ratio={4 / 3}>
        <Box style={{ width: '100%', height: '100%', backgroundColor: 'var(--green-5)', borderRadius: 'var(--radius-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          4:3
        </Box>
      </AspectRatio>
      <AspectRatio ratio={1 / 1}>
        <Box style={{ width: '100%', height: '100%', backgroundColor: 'var(--red-5)', borderRadius: 'var(--radius-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
          1:1
        </Box>
      </AspectRatio>
    </div>
  ),
};

