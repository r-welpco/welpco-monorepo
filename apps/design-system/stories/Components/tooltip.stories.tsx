import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from '@radix-ui/themes';
import { Text } from '@radix-ui/themes';
import { Button } from '@welpco/ui/button';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip"><Button>Hover me</Button></Tooltip>
  ),
};

export const WithText: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Tooltip content="Save your changes"><Button>Save</Button></Tooltip>
      <Tooltip content="Delete this item"><Button color="red" highContrast>Delete</Button></Tooltip>
      <Tooltip content="Edit this item"><Button variant="outline">Edit</Button></Tooltip>
    </div>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Tooltip content="This is a longer tooltip that contains more information about the action or element."><Text style={{ cursor: 'pointer', textDecoration: 'underline' }}>Hover for more info</Text></Tooltip>
  ),
};

