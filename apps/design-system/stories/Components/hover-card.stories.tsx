import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@welpco/ui/hover-card';
import { Avatar, Text, Heading, Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/HoverCard',
  component: HoverCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HoverCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger>
        <Text style={{ cursor: 'pointer', textDecoration: 'underline' }}>Hover me</Text>
      </HoverCardTrigger>
      <HoverCardContent>
        <Flex direction="column" gap="2">
          <Heading size="4">User Profile</Heading>
          <Text size="2">This is additional information that appears on hover.</Text>
        </Flex>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const WithAvatar: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger>
        <Avatar src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80" fallback="JD" style={{ cursor: 'pointer' }} />
      </HoverCardTrigger>
      <HoverCardContent>
        <Flex direction="column" gap="3" style={{ width: '300px' }}>
          <Flex gap="3" align="center">
            <Avatar src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80" fallback="JD" size="3" />
            <Flex direction="column">
              <Heading size="4">John Doe</Heading>
              <Text size="2" color="gray">@johndoe</Text>
            </Flex>
          </Flex>
          <Text size="2">
            Software engineer and designer. Building beautiful user experiences.
          </Text>
        </Flex>
      </HoverCardContent>
    </HoverCard>
  ),
};

