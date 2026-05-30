import type { Meta, StoryObj } from '@storybook/react-vite';
import { JobCard } from '@welpco/ui';

const meta = {
  title: 'Platform/JobPostingMatching/JobCard',
  component: JobCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  args: {
    onView: () => {},
  },
} satisfies Meta<typeof JobCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WelperBrowsing: Story = {
  args: {
    title: 'Help moving furniture to a new apartment',
    category: 'Moving & delivery',
    scheduledDate: 'Tue, 4 Jun',
    scheduledTime: '09:00–11:00',
    location: 'Downtown, City',
    budget: '$150',
    status: 'published',
    customerName: 'Jordan Mendes',
    onApply: () => {},
  },
};

export const AlreadyApplied: Story = {
  args: {
    ...WelperBrowsing.args,
    applied: true,
    onApply: undefined,
  },
};

export const CustomerOwnPost: Story = {
  args: {
    title: 'Garden cleanup before the weekend',
    category: 'Gardening',
    scheduledDate: 'Sat, 8 Jun',
    scheduledTime: '13:00–16:00',
    location: 'Suburbs',
    budget: '$200',
    status: 'applications_open',
    applicationCount: 4,
  },
};

export const NoApplicationsYet: Story = {
  args: {
    ...CustomerOwnPost.args,
    status: 'published',
    applicationCount: 0,
  },
};

export const BookingSent: Story = {
  args: {
    ...CustomerOwnPost.args,
    status: 'converted_to_booking',
    applicationCount: 6,
  },
};
