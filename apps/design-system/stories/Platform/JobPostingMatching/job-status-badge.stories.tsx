import type { Meta, StoryObj } from '@storybook/react-vite';
import { JobStatusBadge } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/JobPostingMatching/JobStatusBadge',
  component: JobStatusBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof JobStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStatuses: Story = {
  render: () => (
    <Flex direction="column" gap="3">
      <JobStatusBadge status="draft" />
      <JobStatusBadge status="open" />
      <JobStatusBadge status="reviewing" />
      <JobStatusBadge status="shortlisted" />
      <JobStatusBadge status="interviewing" />
      <JobStatusBadge status="offer" />
      <JobStatusBadge status="filled" />
      <JobStatusBadge status="cancelled" />
    </Flex>
  ),
};

export const Draft: Story = {
  args: {
    status: 'draft',
  },
};

export const Open: Story = {
  args: {
    status: 'open',
  },
};

export const Reviewing: Story = {
  args: {
    status: 'reviewing',
  },
};

export const Filled: Story = {
  args: {
    status: 'filled',
  },
};

