import type { Meta, StoryObj } from '@storybook/react-vite';
import { AgeVerification } from '@welpco/ui';
import { AuthBackground } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/AgeVerification',
  component: AgeVerification,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AuthBackground>
        <Story />
      </AuthBackground>
    ),
  ],
} satisfies Meta<typeof AgeVerification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onAgeVerified: (age, isMinor) =>
      console.log(`Age verified: ${age}, isMinor: ${isMinor}`),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    onAgeVerified: (age, isMinor) =>
      console.log(`Age verified: ${age}, isMinor: ${isMinor}`),
  },
};

export const WithError: Story = {
  args: {
    error: 'Unable to verify age. Please try again.',
    onAgeVerified: (age, isMinor) =>
      console.log(`Age verified: ${age}, isMinor: ${isMinor}`),
  },
};

