import type { Meta, StoryObj } from '@storybook/react-vite';
import { DisputeStatusBadge } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/DisputeResolution/DisputeStatusBadge',
  component: DisputeStatusBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DisputeStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStatuses: Story = {
  render: () => (
    <Flex direction="column" gap="3">
      <DisputeStatusBadge status="open" />
      <DisputeStatusBadge status="in-review" />
      <DisputeStatusBadge status="resolved" />
      <DisputeStatusBadge status="closed" />
      <DisputeStatusBadge status="escalated" />
    </Flex>
  ),
};

export const Open: Story = {
  args: {
    status: 'open',
  },
};

export const Resolved: Story = {
  args: {
    status: 'resolved',
  },
};

