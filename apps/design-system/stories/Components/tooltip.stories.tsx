import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from '@radix-ui/themes';
import { Button, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Button>Hover me</Button>
      </Tooltip.Trigger>
      <Tooltip.Content>
        This is a tooltip
      </Tooltip.Content>
    </Tooltip.Root>
  ),
};

export const WithText: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button>Save</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Save your changes</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button color="red">Delete</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Delete this item</Tooltip.Content>
      </Tooltip.Root>
      <Tooltip.Root>
        <Tooltip.Trigger>
          <Button variant="outline">Edit</Button>
        </Tooltip.Trigger>
        <Tooltip.Content>Edit this item</Tooltip.Content>
      </Tooltip.Root>
    </div>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <Tooltip.Root>
      <Tooltip.Trigger>
        <Text style={{ cursor: 'pointer', textDecoration: 'underline' }}>Hover for more info</Text>
      </Tooltip.Trigger>
      <Tooltip.Content>
        This is a longer tooltip that contains more information about the action or element.
      </Tooltip.Content>
    </Tooltip.Root>
  ),
};

