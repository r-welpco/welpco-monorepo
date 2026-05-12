import type { Meta, StoryObj } from '@storybook/react-vite';
import { Footer } from '@welpco/ui/platform/layout/footer';
import { Box } from '@radix-ui/themes';

const meta = {
  title: 'Platform/Layout/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box style={{ flex: 1, padding: '48px' }}>
        <p>Page content goes here</p>
      </Box>
      <Footer {...args} />
    </Box>
  ),
  args: {
    variant: 'default',
  },
};

export const Minimal: Story = {
  render: (args) => (
    <Box style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box style={{ flex: 1, padding: '48px' }}>
        <p>Page content goes here</p>
      </Box>
      <Footer {...args} />
    </Box>
  ),
  args: {
    variant: 'minimal',
  },
};

export const Standalone: Story = {
  render: (args) => (
    <Box>
      <Footer {...args} />
    </Box>
  ),
  args: {
    variant: 'default',
  },
};

