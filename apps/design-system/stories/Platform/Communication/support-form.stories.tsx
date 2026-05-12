import type { Meta, StoryObj } from '@storybook/react-vite';
import { SupportForm } from '@welpco/ui';

const meta = {
  title: 'Platform/Communication/SupportForm',
  component: SupportForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SupportForm>;

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
    error: 'Failed to submit ticket. Please try again.',
  },
};

