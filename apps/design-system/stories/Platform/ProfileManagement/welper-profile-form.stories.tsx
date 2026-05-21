import type { Meta, StoryObj } from '@storybook/react-vite';
import { WelperProfileForm } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/WelperProfileForm',
  component: WelperProfileForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof WelperProfileForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <WelperProfileForm
      onSubmit={async (values) => {
        console.log('Form submitted:', values);
      }}
    />
  ),
};

export const WithDefaultValues: Story = {
  render: () => (
    <WelperProfileForm
      defaultValues={{
        firstName: 'Alex',
        lastName: 'Carter',
        phone: '+1 (555) 000-0000',
        bio: 'Experienced home cleaning professional with 5 years of expertise. I specialize in deep cleaning and organization services.',
        profileVisibility: 'Public',
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
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
  args: { error: 'Could not save profile. Please check your information and try again.' },
};

export const PrivateProfile: Story = {
  render: () => (
    <WelperProfileForm
      showProfileVisibility
      defaultValues={{
        firstName: 'Alex',
        lastName: 'Carter',
        phone: '+1 (555) 000-0000',
        bio: 'Experienced service provider with expertise in home maintenance and cleaning.',
        profileVisibility: 'Private',
      }}
      onSubmit={async (values) => {
        console.log('Form submitted:', values);
      }}
    />
  ),
};
