import type { Meta, StoryObj } from '@storybook/react-vite';
import { GuardianAccountForm } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/GuardianAccountForm',
  component: GuardianAccountForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof GuardianAccountForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const WithError: Story = {
  args: { error: 'Guardian already exists for this child.' },
};

