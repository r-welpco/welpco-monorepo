import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccountTypeSelection } from '@welpco/ui';
import { AuthBackground } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/AccountTypeSelection',
  component: AccountTypeSelection,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AuthBackground>
        <Story />
      </AuthBackground>
    ),
  ],
} satisfies Meta<typeof AccountTypeSelection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSelectCustomer: () => console.log('Customer selected'),
    onSelectWelper: () => console.log('Welper selected'),
    onSignIn: () => console.log('Sign in clicked'),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    onSelectCustomer: () => console.log('Customer selected'),
    onSelectWelper: () => console.log('Welper selected'),
  },
};

export const CustomerOnly: Story = {
  args: {
    onSelectCustomer: () => console.log('Customer selected'),
    onSignIn: () => console.log('Sign in clicked'),
  },
};

export const WelperOnly: Story = {
  args: {
    onSelectWelper: () => console.log('Welper selected'),
    onSignIn: () => console.log('Sign in clicked'),
  },
};

