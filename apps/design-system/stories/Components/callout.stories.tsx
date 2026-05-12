import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from '@welpco/ui/callout';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Callout',
  component: Callout,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Callout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a callout with important information.',
  },
};

export const Variants: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Callout color="blue">
        <Text>This is an informational callout.</Text>
      </Callout>
      <Callout color="green">
        <Text>This is a success callout.</Text>
      </Callout>
      <Callout color="amber">
        <Text>This is a warning callout.</Text>
      </Callout>
      <Callout color="red">
        <Text>This is an error callout.</Text>
      </Callout>
    </Flex>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Callout color="blue">
        <Text>This callout can include icons and formatted content.</Text>
      </Callout>
    </Flex>
  ),
};

