import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextArea } from '@welpco/ui/text-area';
import { Flex, Text, Box } from '@radix-ui/themes';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3'],
    },
    variant: {
      control: 'select',
      options: ['classic', 'surface', 'soft'],
    },
    rows: {
      control: 'number',
    },
  },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Size 1
        </Text>
        <TextArea size="1" placeholder="Size 1" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Size 2
        </Text>
        <TextArea size="2" placeholder="Size 2" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Size 3
        </Text>
        <TextArea size="3" placeholder="Size 3" />
      </Box>
    </Flex>
  ),
};

export const Variants: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Classic
        </Text>
        <TextArea variant="classic" placeholder="Classic variant" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Surface
        </Text>
        <TextArea variant="surface" placeholder="Surface variant" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Soft
        </Text>
        <TextArea variant="soft" placeholder="Soft variant" />
      </Box>
    </Flex>
  ),
};

export const Rows: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          3 Rows
        </Text>
        <TextArea rows={3} placeholder="3 rows" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          5 Rows
        </Text>
        <TextArea rows={5} placeholder="5 rows" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          10 Rows
        </Text>
        <TextArea rows={10} placeholder="10 rows" />
      </Box>
    </Flex>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <TextArea placeholder="Disabled textarea" disabled />
    </Flex>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '400px' }}>
      <Box>
        <Text as="label" size="2" weight="medium" htmlFor="text-area-description" mb="1" style={{ display: 'block' }}>
          Description
        </Text>
        <TextArea id="text-area-description" placeholder="Enter a description..." rows={5} />
      </Box>
    </Flex>
  ),
};

