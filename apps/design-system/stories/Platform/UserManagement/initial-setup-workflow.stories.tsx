import type { Meta, StoryObj } from '@storybook/react-vite';
import { InitialSetupWorkflow } from '@welpco/ui';
import { AuthBackground } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/InitialSetupWorkflow',
  component: InitialSetupWorkflow,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AuthBackground>
        <Story />
      </AuthBackground>
    ),
  ],
} satisfies Meta<typeof InitialSetupWorkflow>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockCategories = [
  { id: 'cat-1', name: 'Home Cleaning' },
  { id: 'cat-2', name: 'Child Care' },
  { id: 'cat-3', name: 'Pet Care' },
];

export const CustomerFlow: Story = {
  args: {
    accountType: 'customer',
    email: 'customer@example.com',
    customerPreferenceCategories: mockCategories,
    customerPreferenceCategoriesLoading: false,
    onComplete: () => console.log('Setup complete'),
    onSkip: () => console.log('Setup skipped'),
  },
};

export const WelperFlow: Story = {
  args: {
    accountType: 'welper',
    email: 'welper@example.com',
    onComplete: () => console.log('Setup complete'),
    onSkip: () => console.log('Setup skipped'),
  },
};

export const Loading: Story = {
  args: {
    accountType: 'customer',
    email: 'customer@example.com',
    customerPreferenceCategories: mockCategories,
    loading: true,
    onComplete: () => console.log('Setup complete'),
  },
};

