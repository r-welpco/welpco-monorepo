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

export const Default: Story = {
  args: {
    candidateName: 'John Doe',
    role: 'Senior Mover',
    hourlyRate: '$120/hr',
    submittedAt: '1 hour ago',
    coverLetter: 'I have 5 years of experience in moving and furniture handling. I am reliable and have all necessary equipment.',
    status: 'new',
  },
};

export const Shortlisted: Story = {
  args: {
    candidateName: 'Jane Smith',
    role: 'Professional Mover',
    hourlyRate: '$150/hr',
    submittedAt: '2 hours ago',
    coverLetter: 'Available this weekend and have all necessary equipment. I specialize in delicate items.',
    status: 'shortlist',
  },
};

export const Hired: Story = {
  args: {
    candidateName: 'Bob Johnson',
    role: 'Experienced Mover',
    hourlyRate: '$100/hr',
    submittedAt: '3 hours ago',
    coverLetter: 'Can help with moving tasks. Available immediately.',
    status: 'hired',
  },
};

export const Rejected: Story = {
  args: {
    candidateName: 'Alice Williams',
    role: 'Junior Mover',
    hourlyRate: '$80/hr',
    submittedAt: '4 hours ago',
    coverLetter: 'Looking for moving opportunities.',
    status: 'reject',
  },
};

