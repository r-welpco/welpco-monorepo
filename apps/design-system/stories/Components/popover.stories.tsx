import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@welpco/ui/popover';
import { Button } from '@welpco/ui/button';
import { Text, Heading, Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/Popover',
  component: Popover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>
        <Button>Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <Flex direction="column" gap="3">
          <Heading size="4">Popover Title</Heading>
          <Text size="2">This is the content of the popover. It can contain any React elements.</Text>
          <Button size="2">Action</Button>
        </Flex>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger>
        <Button>Edit Profile</Button>
      </PopoverTrigger>
      <PopoverContent>
        <Flex direction="column" gap="3" style={{ width: '300px' }}>
          <Heading size="4">Edit Profile</Heading>
          <Text size="2" color="gray">Make changes to your profile here.</Text>
          <Button size="2" style={{ width: '100%' }}>Save Changes</Button>
        </Flex>
      </PopoverContent>
    </Popover>
  ),
};

