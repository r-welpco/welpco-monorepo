import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from '@welpco/ui/callout';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Callout',
  component: Callout.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Callout.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Callout.Text>This is a callout with important information.</Callout.Text>,
  },
};

export const Variants: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Callout.Root highContrast color="blue">
        <Callout.Text>This is an informational callout.</Callout.Text>
      </Callout.Root>
      <Callout.Root highContrast color="green">
        <Callout.Text>This is a success callout.</Callout.Text>
      </Callout.Root>
      <Callout.Root highContrast color="amber">
        <Callout.Text>This is a warning callout.</Callout.Text>
      </Callout.Root>
      <Callout.Root highContrast color="red">
        <Callout.Text>This is an error callout.</Callout.Text>
      </Callout.Root>
    </Flex>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Callout.Root highContrast color="blue">
        <Callout.Text>This callout can include icons and formatted content.</Callout.Text>
      </Callout.Root>
    </Flex>
  ),
};

