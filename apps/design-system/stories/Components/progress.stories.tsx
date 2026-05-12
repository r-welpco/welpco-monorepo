import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from '@welpco/ui/progress';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Progress',
  component: Progress,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 50,
    style: { width: '400px' },
    'aria-label': 'Loading progress',
  },
};

export const Values: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '400px' }}>
      <Flex direction="column" gap="2">
        <Text size="2">25% Complete</Text>
        <Progress value={25} aria-label="25 percent complete" />
      </Flex>
      <Flex direction="column" gap="2">
        <Text size="2">50% Complete</Text>
        <Progress value={50} aria-label="50 percent complete" />
      </Flex>
      <Flex direction="column" gap="2">
        <Text size="2">75% Complete</Text>
        <Progress value={75} aria-label="75 percent complete" />
      </Flex>
      <Flex direction="column" gap="2">
        <Text size="2">100% Complete</Text>
        <Progress value={100} aria-label="100 percent complete" />
      </Flex>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '400px' }}>
      <Flex direction="column" gap="2">
        <Text size="2">Blue Progress</Text>
        <Progress value={60} color="blue" aria-label="Blue progress" />
      </Flex>
      <Flex direction="column" gap="2">
        <Text size="2">Green Progress</Text>
        <Progress value={60} color="green" aria-label="Green progress" />
      </Flex>
      <Flex direction="column" gap="2">
        <Text size="2">Red Progress</Text>
        <Progress value={60} color="red" aria-label="Red progress" />
      </Flex>
    </Flex>
  ),
};

