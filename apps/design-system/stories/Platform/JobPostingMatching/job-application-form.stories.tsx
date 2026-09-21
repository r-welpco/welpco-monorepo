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
    matchingOfferings: [{ id: 'offering-1', hourlyRate: 35, serviceDescription: 'Moving help' }],
    onSubmit: (values) => console.log('submit', values),
  },
};

export const Loading: Story = {
  args: {
    matchingOfferings: [{ id: 'offering-1', hourlyRate: 35, serviceDescription: 'Moving help' }],
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    matchingOfferings: [{ id: 'offering-1', hourlyRate: 35, serviceDescription: 'Moving help' }],
    error: 'Failed to submit application. Please try again.',
  },
};

