import type { Meta, StoryObj } from '@storybook/react-vite';
import { SEMANTIC_COLOR } from '@welpco/ui/tokens';
import { Spinner } from '@welpco/ui/spinner';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" align="center">
      <Flex direction="column" align="center" gap="2">
        <Spinner size="1" />
        <Text size="1">Size 1</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Spinner size="2" />
        <Text size="1">Size 2</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Spinner size="3" />
        <Text size="1">Size 3</Text>
      </Flex>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="4" align="center">
      <Flex direction="column" align="center" gap="2">
        <Text color={SEMANTIC_COLOR.info}><Spinner /></Text>
        <Text size="1">Blue</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Text color={SEMANTIC_COLOR.success}><Spinner /></Text>
        <Text size="1">Green</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Text color={SEMANTIC_COLOR.danger}><Spinner /></Text>
        <Text size="1">Red</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Text color="gray"><Spinner /></Text>
        <Text size="1">Gray</Text>
      </Flex>
    </Flex>
  ),
};

