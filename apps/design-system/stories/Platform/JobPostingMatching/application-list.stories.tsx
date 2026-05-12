import type { Meta, StoryObj } from '@storybook/react-vite';
import { ApplicationList } from '@welpco/ui';

const meta = {
  title: 'Platform/JobPostingMatching/ApplicationList',
  component: ApplicationList,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ApplicationList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleApplications = [
  {
    candidateName: 'John Doe',
    role: 'Senior Mover',
    hourlyRate: '$120/hr',
    submittedAt: '1 hour ago',
    coverLetter: 'I have 5 years of experience in moving and furniture handling. I am reliable and have all necessary equipment.',
    status: 'new' as const,
  },
  {
    candidateName: 'Jane Smith',
    role: 'Professional Mover',
    hourlyRate: '$150/hr',
    submittedAt: '2 hours ago',
    coverLetter: 'Available this weekend and have all necessary equipment. I specialize in delicate items.',
    status: 'shortlist' as const,
  },
];

export const Default: Story = {
  args: {
    items: sampleApplications,
  },
};

export const Empty: Story = {
  args: {
    items: [],
  },
};

export const Loading: Story = {
  args: {
    items: [],
    loading: true,
  },
};

