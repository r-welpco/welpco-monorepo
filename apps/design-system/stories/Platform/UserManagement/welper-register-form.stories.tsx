import type { Meta, StoryObj } from '@storybook/react-vite';
import { WelperRegisterForm } from '@welpco/ui';
import { AuthBackground } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/WelperRegisterForm',
  component: WelperRegisterForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AuthBackground>
        <Story />
      </AuthBackground>
    ),
  ],
} satisfies Meta<typeof WelperRegisterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (values) => console.log('submit', values),
    onSignIn: () => console.log('Sign in clicked'),
  },
};

export const MinorAccount: Story = {
  args: {
    isMinor: true,
    onGuardianRequired: () => console.log('Guardian required'),
    onSubmit: (values) => console.log('submit', values),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    onSubmit: (values) => console.log('submit', values),
  },
};

export const WithError: Story = {
  args: {
    error: 'Email already exists. Try another.',
    onSubmit: (values) => console.log('submit', values),
  },
};

export const WithoutReferralCode: Story = {
  args: {
    showReferralCode: false,
    onSubmit: (values) => console.log('submit', values),
  },
};

