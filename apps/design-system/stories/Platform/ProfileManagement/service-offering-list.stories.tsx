import type { Meta, StoryObj } from '@storybook/react-vite';
import { ServiceOfferingList } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/ServiceOfferingList',
  component: ServiceOfferingList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ServiceOfferingList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: '960px' }}>
      <ServiceOfferingList
        offerings={[
          {
            id: '1',
            title: 'Premium Home Cleaning',
            categoryId: 'home-cleaning',
            categoryName: 'Home Cleaning',
            subcategories: [
              { id: 'deep-clean', name: 'Deep clean' },
              { id: 'move-out', name: 'Move-out clean' },
            ],
            hourlyRate: 45,
            experienceYears: 5,
            description: 'Deep cleaning service for your home',
            rating: 4.8,
            reviewsCount: 24,
            active: true,
          },
          {
            id: '2',
            title: 'Pet Care Services',
            categoryId: 'pet-care',
            categoryName: 'Pet Care',
            subcategories: [{ id: 'dog-walk', name: 'Dog walking' }],
            hourlyRate: 35,
            experienceYears: 2,
            description: 'Professional pet care and walking',
            rating: 4.9,
            reviewsCount: 18,
            active: true,
          },
          {
            id: '3',
            title: 'Tutoring Services',
            categoryId: 'tutoring',
            categoryName: 'Tutoring',
            hourlyRate: 50,
            experienceYears: 8,
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
    <div style={{ width: '100%', maxWidth: '960px' }}>
      <ServiceOfferingList
        offerings={[]}
        onAdd={() => console.log('Add offering')}
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: '960px' }}>
      <ServiceOfferingList
        offerings={[
          {
            id: '1',
            title: 'Premium Home Cleaning',
            categoryId: 'home-cleaning',
            categoryName: 'Home Cleaning',
            hourlyRate: 45,
            active: true,
          },
        ]}
        loading={true}
      />
    </div>
  ),
};
