import type { Meta, StoryObj } from '@storybook/react-vite';
import { JobApplicationForm } from '@welpco/ui';

const meta = {
  title: 'Platform/JobPostingMatching/JobApplicationForm',
  component: JobApplicationForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof JobApplicationForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    jobId: 'JOB-001',
    onSubmit: (values) => console.log('submit', values),
  },
};

export const Loading: Story = {
  args: {
    jobId: 'JOB-001',
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    jobId: 'JOB-001',
    error: 'Failed to submit application. Please try again.',
  },
};

