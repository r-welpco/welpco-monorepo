import type { Meta, StoryObj } from '@storybook/react-vite';
import { DisputeForm } from '@welpco/ui';

const meta = {
  title: 'Platform/DisputeResolution/DisputeForm',
  component: DisputeForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof DisputeForm>;

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
    error: 'Failed to submit dispute. Please try again.',
  },
};

