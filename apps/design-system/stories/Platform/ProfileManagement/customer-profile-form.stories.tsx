import type { Meta, StoryObj } from '@storybook/react-vite';
import { CustomerProfileForm } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/CustomerProfileForm',
  component: CustomerProfileForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof CustomerProfileForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <CustomerProfileForm
      onSubmit={async (values) => {
        console.log('Form submitted:', values);
      }}
    />
  ),
};

export const WithDefaultValues: Story = {
  render: () => (
    <CustomerProfileForm
      defaultValues={{
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '+1 (555) 123-4567',
        address: {
          streetAddress: '123 Main Street',
          city: 'San Francisco',
          stateProvince: 'CA',
          zipPostalCode: '94102',
          country: 'United States',
        },
        bio: 'I love working with local Welpers for home services.',
      }}
      onSubmit={async (values) => {
        console.log('Form submitted:', values);
      }}
    />
  ),
};

export const Loading: Story = {
  args: { loading: true },
};

export const WithError: Story = {
  args: { error: 'Unable to save profile. Please check your information and try again.' },
};

export const ValidationExample: Story = {
  render: () => (
    <CustomerProfileForm
      defaultValues={{
        firstName: 'J',
        lastName: '',
        phone: '123',
        address: {
          streetAddress: '12',
          city: '',
          stateProvince: '',
          zipPostalCode: '',
        },
      }}
      onSubmit={async (values) => {
        console.log('Form submitted:', values);
      }}
    />
  ),
};
