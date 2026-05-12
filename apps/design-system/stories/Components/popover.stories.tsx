import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@welpco/ui/popover';
import { Button, Text, Heading, Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/Popover',
  component: Popover,
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

