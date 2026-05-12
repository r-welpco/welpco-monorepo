import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServicePreferences } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/ServicePreferences',
  component: ServicePreferences,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServicePreferences>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <ServicePreferences
        serviceCategories={[
          { id: 'home-cleaning', name: 'Home Cleaning' },
          { id: 'child-care', name: 'Child Care' },
          { id: 'pet-care', name: 'Pet Care' },
          { id: 'handyman', name: 'Handyman' },
          { id: 'tutoring', name: 'Tutoring' },
          { id: 'wellness', name: 'Wellness' },
        ]}
        onSubmit={(values) => {
          console.log('Preferences saved:', values);
        }}
      />
    </div>
  ),
};

export const WithDefaultValues: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <ServicePreferences
        defaultValues={{
          preferredCategories: ['home-cleaning', 'pet-care'],
        }}
        serviceCategories={[
          { id: 'home-cleaning', name: 'Home Cleaning' },
          { id: 'pet-care', name: 'Pet Care' },
        ]}
        onSubmit={(values) => {
          console.log('Preferences saved:', values);
        }}
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <ServicePreferences
        loading={true}
        serviceCategories={[
          { id: 'home-cleaning', name: 'Home Cleaning' },
          { id: 'pet-care', name: 'Pet Care' },
        ]}
        onSubmit={(values) => {
          console.log('Preferences saved:', values);
        }}
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div style={{ width: '800px' }}>
      <ServicePreferences
        error="Failed to save preferences. Please try again."
        serviceCategories={[
          { id: 'home-cleaning', name: 'Home Cleaning' },
          { id: 'pet-care', name: 'Pet Care' },
        ]}
        onSubmit={(values) => {
          console.log('Preferences saved:', values);
        }}
      />
    </div>
  ),
};

