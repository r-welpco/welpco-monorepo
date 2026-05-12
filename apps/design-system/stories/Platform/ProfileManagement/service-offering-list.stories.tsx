import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceOfferingList } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/ServiceOfferingList',
  component: ServiceOfferingList,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServiceOfferingList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: '1200px' }}>
      <ServiceOfferingList
        offerings={[
          {
            id: '1',
            title: 'Premium Home Cleaning',
            category: 'home-cleaning',
            hourlyRate: 45,
            durationMinutes: 120,
            description: 'Deep cleaning service for your home',
            rating: 4.8,
            reviewsCount: 24,
            active: true,
          },
          {
            id: '2',
            title: 'Pet Care Services',
            category: 'pet-care',
            hourlyRate: 35,
            durationMinutes: 60,
            description: 'Professional pet care and walking',
            rating: 4.9,
            reviewsCount: 18,
            active: true,
          },
          {
            id: '3',
            title: 'Tutoring Services',
            category: 'tutoring',
            hourlyRate: 50,
            durationMinutes: 90,
            description: 'Math and science tutoring',
            active: false,
          },
        ]}
        serviceCategories={[
          { id: 'home-cleaning', name: 'Home Cleaning' },
          { id: 'pet-care', name: 'Pet Care' },
          { id: 'tutoring', name: 'Tutoring' },
        ]}
        onAdd={() => console.log('Add offering')}
        onEdit={(id) => console.log('Edit:', id)}
        onDelete={(id) => console.log('Delete:', id)}
        onToggleActive={(id, active) => console.log('Toggle:', id, active)}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ width: '1200px' }}>
      <ServiceOfferingList
        offerings={[]}
        onAdd={() => console.log('Add offering')}
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ width: '1200px' }}>
      <ServiceOfferingList
        offerings={[
          {
            id: '1',
            title: 'Premium Home Cleaning',
            category: 'home-cleaning',
            hourlyRate: 45,
            active: true,
          },
        ]}
        loading={true}
      />
    </div>
  ),
};

