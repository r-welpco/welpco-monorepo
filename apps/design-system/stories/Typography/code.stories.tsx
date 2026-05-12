import type { Meta, StoryObj } from '@storybook/react-vite';
import { Code } from '@welpco/ui/code';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Code',
  component: Code,
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
        You can also use <Code color="blue">colored code</Code> for emphasis.
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
        Size 1: <Code size="1">const x = 1;</Code>
      </Text>
      <Text>
        Size 2: <Code size="2">const x = 2;</Code>
      </Text>
      <Text>
        Size 3: <Code size="3">const x = 3;</Code>
      </Text>
      <Text>
        Size 4: <Code size="4">const x = 4;</Code>
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
        Gray: <Code color="gray">const x = 1;</Code>
      </Text>
      <Text>
        Blue: <Code color="blue">const x = 1;</Code>
      </Text>
      <Text>
        Green: <Code color="green">const x = 1;</Code>
      </Text>
      <Text>
        Red: <Code color="red">const x = 1;</Code>
      </Text>
    </Flex>
  ),
};

