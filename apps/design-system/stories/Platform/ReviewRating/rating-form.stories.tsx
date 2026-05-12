import type { Meta, StoryObj } from '@storybook/react-vite';
import { RatingForm } from '@welpco/ui';

const meta = {
  title: 'Platform/ReviewRating/RatingForm',
  component: RatingForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RatingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (values) => console.log('submit', values),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    error: 'Failed to submit review. Please try again.',
  },
};

export const WithDefaultRating: Story = {
  args: {
    defaultValues: {
      rating: 4,
      comment: 'Great service overall!',
    },
  },
};

