import type { Meta, StoryObj } from '@storybook/react-vite';
import { JobPostingForm } from '@welpco/ui';

const meta = {
  title: 'Platform/JobPostingMatching/JobPostingForm',
  component: JobPostingForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof JobPostingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleCategories = [
  { id: '1', label: 'Home Cleaning' },
  { id: '2', label: 'Moving & Packing' },
  { id: '3', label: 'Handyman Services' },
  { id: '4', label: 'Pet Care' },
  { id: '5', label: 'Child Care' },
];

export const Default: Story = {
  args: {
    categories: sampleCategories,
    onSubmit: (values) => console.log('submit', values),
  },
};

export const Loading: Story = {
  args: {
    categories: sampleCategories,
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    categories: sampleCategories,
    error: 'Failed to create job posting. Please try again.',
  },
};

