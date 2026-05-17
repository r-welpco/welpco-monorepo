import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceOfferingForm } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/ServiceOfferingForm',
  component: ServiceOfferingForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServiceOfferingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ServiceOfferingForm
      serviceCategories={[
        { id: 'home-cleaning', name: 'Home Cleaning' },
        { id: 'child-care', name: 'Child Care' },
        { id: 'pet-care', name: 'Pet Care' },
        { id: 'handyman', name: 'Handyman' },
        { id: 'tutoring', name: 'Tutoring' },
        { id: 'wellness', name: 'Wellness' },
      ]}
      onSubmit={async (values) => {
        console.log('Form submitted:', values);
      }}
    />
  ),
};

export const WithDefaultServiceArea: Story = {
  render: () => (
    <ServiceOfferingForm
      defaultServiceArea={{
        type: 'radius',
        centerAddress: {
          streetAddress: '123 Main Street',
          city: 'San Francisco',
          stateProvince: 'CA',
          zipPostalCode: '94102',
          country: 'United States',
        },
        radiusKm: 25,
      }}
      serviceCategories={[
        { id: 'home-cleaning', name: 'Home Cleaning' },
        { id: 'pet-care', name: 'Pet Care' },
      ]}
      onSubmit={async (values) => {
        console.log('Form submitted:', values);
      }}
    />
  ),
};

export const WithServiceAreaOverride: Story = {
  render: () => (
    <ServiceOfferingForm
      defaultValues={{
        title: 'Premium Home Cleaning',
        category: 'home-cleaning',
        hourlyRate: 60,
        experienceYears: 5,
        serviceAreaOverride: true,
        serviceArea: {
          type: 'radius',
          centerAddress: {
            streetAddress: '456 Oak Avenue',
            city: 'Oakland',
            stateProvince: 'CA',
            zipPostalCode: '94601',
            country: 'United States',
          },
          radiusKm: 15,
        },
      }}
      defaultServiceArea={{
        type: 'radius',
        centerAddress: {
          streetAddress: '123 Main Street',
          city: 'San Francisco',
          stateProvince: 'CA',
          zipPostalCode: '94102',
          country: 'United States',
        },
        radiusKm: 25,
      }}
      serviceCategories={[
        { id: 'home-cleaning', name: 'Home Cleaning' },
      ]}
      onSubmit={async (values) => {
        console.log('Form submitted:', values);
      }}
    />
  ),
};

export const Inactive: Story = {
  render: () => (
    <ServiceOfferingForm
      defaultValues={{
        title: 'Home Cleaning Service',
        category: 'home-cleaning',
        hourlyRate: 50,
        experienceYears: 3,
        active: false,
      }}
      serviceCategories={[
        { id: 'home-cleaning', name: 'Home Cleaning' },
      ]}
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
  args: { error: 'Failed to save offering. Please try again.' },
};
