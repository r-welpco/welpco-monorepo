import type { Meta, StoryObj } from '@storybook/react-vite';
import { JobCard } from '@welpco/ui';

const meta = {
  title: 'Platform/JobPostingMatching/JobCard',
  component: JobCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof JobCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'JOB-001',
    title: 'Need help with moving',
    description: 'Looking for assistance moving furniture to a new apartment.',
    location: 'Downtown, City',
    budget: 150,
    status: 'open',
    postedAt: '2 hours ago',
  },
};

export const InProgress: Story = {
  args: {
    id: 'JOB-002',
    title: 'Garden cleanup',
    description: 'Need help cleaning up the backyard garden.',
    location: 'Suburbs',
    budget: 200,
    status: 'in-progress',
    postedAt: '1 day ago',
  },
};

export const Completed: Story = {
  args: {
    id: 'JOB-003',
    title: 'Pet sitting',
    description: 'Looking for someone to watch my dog for the weekend.',
    location: 'City Center',
    budget: 100,
    status: 'completed',
    postedAt: '3 days ago',
  },
};

