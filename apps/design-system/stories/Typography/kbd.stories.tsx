import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from '@welpco/ui/kbd';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Kbd',
  component: Kbd,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Ctrl',
  },
};

export const KeyboardShortcuts: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Text>
        Press <Kbd>Ctrl</Kbd> + <Kbd>C</Kbd> to copy
      </Text>
      <Text>
        Press <Kbd>Ctrl</Kbd> + <Kbd>V</Kbd> to paste
      </Text>
      <Text>
        Press <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> to open command palette
      </Text>
      <Text>
        Press <Kbd>Esc</Kbd> to close
      </Text>
    </Flex>
  ),
};

export const ComplexShortcuts: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Text>
        <Kbd>Ctrl</Kbd> + <Kbd>Shift</Kbd> + <Kbd>P</Kbd> for command palette
      </Text>
      <Text>
        <Kbd>Alt</Kbd> + <Kbd>Tab</Kbd> to switch windows
      </Text>
      <Text>
        <Kbd>Cmd</Kbd> + <Kbd>Option</Kbd> + <Kbd>Esc</Kbd> to force quit
      </Text>
    </Flex>
  ),
};

