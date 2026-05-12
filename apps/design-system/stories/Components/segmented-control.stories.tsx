import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedControl } from '@radix-ui/themes';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/SegmentedControl',
  component: SegmentedControl.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SegmentedControl.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <SegmentedControl.Root defaultValue="option1">
      <SegmentedControl.Item value="option1">Option 1</SegmentedControl.Item>
      <SegmentedControl.Item value="option2">Option 2</SegmentedControl.Item>
      <SegmentedControl.Item value="option3">Option 3</SegmentedControl.Item>
    </SegmentedControl.Root>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <SegmentedControl.Root defaultValue="list">
      <SegmentedControl.Item value="list">List</SegmentedControl.Item>
      <SegmentedControl.Item value="grid">Grid</SegmentedControl.Item>
      <SegmentedControl.Item value="map">Map</SegmentedControl.Item>
    </SegmentedControl.Root>
  ),
};

