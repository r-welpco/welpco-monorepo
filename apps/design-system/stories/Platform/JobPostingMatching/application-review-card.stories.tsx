import type { Meta, StoryObj } from '@storybook/react-vite';
import { ApplicationReviewCard } from '@welpco/ui';

const meta = {
  title: 'Platform/JobPostingMatching/ApplicationReviewCard',
  component: ApplicationReviewCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ApplicationReviewCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: {
    candidateName: 'Jane Smith',
    role: 'Professional Mover',
    hourlyRate: '$150/hr',
    submittedAt: '2 hours ago',
    proposalMessage:
      'Available this weekend and I have all the necessary equipment. I specialize in handling delicate items and can bring a second helper if needed.',
    status: 'pending',
    welperVerified: true,
    onSendBookingRequest: () => {},
  },
};

export const Unverified: Story = {
  args: {
    candidateName: 'John Doe',
    role: 'Senior Mover',
    hourlyRate: '$120/hr',
    submittedAt: '1 hour ago',
    proposalMessage:
      'I have 5 years of experience in moving and furniture handling. Reliable, punctual, and fully insured.',
    status: 'pending',
    onSendBookingRequest: () => {},
  },
};

export const Selected: Story = {
  args: {
    candidateName: 'Bob Johnson',
    role: 'Experienced Mover',
    hourlyRate: '$100/hr',
    submittedAt: '3 hours ago',
    proposalMessage: 'Can help with all moving tasks. Available immediately.',
    status: 'accepted',
    welperVerified: true,
  },
};

export const Rejected: Story = {
  args: {
    candidateName: 'Alice Williams',
    role: 'Junior Mover',
    hourlyRate: '$80/hr',
    submittedAt: '4 hours ago',
    proposalMessage: 'Looking for moving opportunities in the area.',
    status: 'rejected',
  },
};
