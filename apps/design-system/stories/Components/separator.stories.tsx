import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from '@welpco/ui/separator';
import { Flex, Text, Card, Box } from '@radix-ui/themes';

const meta = {
  title: 'Components/Separator',
  component: Separator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3', '4'],
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '300px' }}>
      <Box>
        <Text size="2" mb="2">Size 1</Text>
        <Separator size="1" />
      </Box>
      <Box>
        <Text size="2" mb="2">Size 2</Text>
        <Separator size="2" />
      </Box>
      <Box>
        <Text size="2" mb="2">Size 3</Text>
        <Separator size="3" />
      </Box>
      <Box>
        <Text size="2" mb="2">Size 4</Text>
        <Separator size="4" />
      </Box>
    </Flex>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '300px' }}>
      <Text>Item 1</Text>
      <Separator />
      <Text>Item 2</Text>
      <Separator />
      <Text>Item 3</Text>
    </Flex>
  ),
};

export const Vertical: Story = {
  render: () => (
    <Flex gap="4" align="center" style={{ height: '100px' }}>
      <Text>Left</Text>
      <Separator orientation="vertical" />
      <Text>Middle</Text>
      <Separator orientation="vertical" />
      <Text>Right</Text>
    </Flex>
  ),
};

export const InCard: Story = {
  render: () => (
    <Card size="3" style={{ width: '300px' }}>
      <Flex direction="column" gap="4">
        <Box>
          <Text size="3" weight="bold">Section 1</Text>
          <Text size="2" color="gray">Content for section 1</Text>
        </Box>
        <Separator size="4" />
        <Box>
          <Text size="3" weight="bold">Section 2</Text>
          <Text size="2" color="gray">Content for section 2</Text>
        </Box>
        <Separator size="4" />
        <Box>
          <Text size="3" weight="bold">Section 3</Text>
          <Text size="2" color="gray">Content for section 3</Text>
        </Box>
      </Flex>
    </Card>
  ),
};

