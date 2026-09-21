import type { Meta, StoryObj } from '@storybook/react-vite';
import { Code } from '@welpco/ui/code';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Code',
  component: Code,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    },
    color: {
      control: 'select',
      options: ['gray', 'blue', 'green', 'red', 'amber'],
    },
  },
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'const example = "code";',
  },
};

export const Inline: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Text>
        Use the <Code>Code</Code> component for inline code snippets.
      </Text>
      <Text>
        You can also use <Code highContrast color="blue">colored code</Code> for emphasis.
      </Text>
      <Text>
        Example: <Code>npm install @welpco/ui</Code>
      </Text>
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text>
        Size 1: <Code highContrast size="1">const x = 1;</Code>
      </Text>
      <Text>
        Size 2: <Code highContrast size="2">const x = 2;</Code>
      </Text>
      <Text>
        Size 3: <Code highContrast size="3">const x = 3;</Code>
      </Text>
      <Text>
        Size 4: <Code highContrast size="4">const x = 4;</Code>
      </Text>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text>
        Default: <Code>const x = 1;</Code>
      </Text>
      <Text>
        Gray: <Code highContrast color="gray">const x = 1;</Code>
      </Text>
      <Text>
        Blue: <Code highContrast color="blue">const x = 1;</Code>
      </Text>
      <Text>
        Green: <Code highContrast color="green">const x = 1;</Code>
      </Text>
      <Text>
        Red: <Code highContrast color="red">const x = 1;</Code>
      </Text>
    </Flex>
  ),
};

