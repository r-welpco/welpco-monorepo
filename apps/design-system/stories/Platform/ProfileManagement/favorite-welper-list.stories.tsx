import type { Meta, StoryObj } from '@storybook/react-vite';
import { FavoriteWelperList } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/FavoriteWelperList',
  component: FavoriteWelperList,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof FavoriteWelperList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ width: '1200px' }}>
      <FavoriteWelperList
        favorites={[
          {
            id: '1',
            name: 'Sarah Johnson',
            role: 'Home Cleaning Specialist',
            location: 'San Francisco, CA',
            rating: 4.9,
            completedJobs: 45,
            lastBooked: new Date('2024-11-15'),
          },
          {
            id: '2',
            name: 'Mike Chen',
            role: 'Pet Care Professional',
            location: 'Oakland, CA',
            rating: 4.8,
            completedJobs: 32,
            lastBooked: new Date('2024-11-10'),
          },
          {
            id: '3',
            name: 'Emily Rodriguez',
            role: 'Tutoring Expert',
            location: 'Berkeley, CA',
            rating: 5.0,
            completedJobs: 28,
            lastBooked: new Date('2024-11-20'),
          },
        ]}
        onRemove={(id) => console.log('Remove:', id)}
        onViewProfile={(id) => console.log('View profile:', id)}
        onQuickRebook={(id) => console.log('Quick rebook:', id)}
      />
    </div>
  ),
};

export const ListView: Story = {
  render: () => (
    <div style={{ width: '1200px' }}>
      <FavoriteWelperList
        favorites={[
          {
            id: '1',
            name: 'Sarah Johnson',
            role: 'Home Cleaning Specialist',
            location: 'San Francisco, CA',
            rating: 4.9,
            completedJobs: 45,
          },
          {
            id: '2',
            name: 'Mike Chen',
            role: 'Pet Care Professional',
            location: 'Oakland, CA',
            rating: 4.8,
            completedJobs: 32,
          },
        ]}
        viewMode="list"
        onRemove={(id) => console.log('Remove:', id)}
        onViewProfile={(id) => console.log('View profile:', id)}
        onQuickRebook={(id) => console.log('Quick rebook:', id)}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div style={{ width: '1200px' }}>
      <FavoriteWelperList
        favorites={[]}
        onRemove={(id) => console.log('Remove:', id)}
        onViewProfile={(id) => console.log('View profile:', id)}
        onQuickRebook={(id) => console.log('Quick rebook:', id)}
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div style={{ width: '1200px' }}>
      <FavoriteWelperList
        favorites={[
          {
            id: '1',
            name: 'Sarah Johnson',
            role: 'Home Cleaning Specialist',
            location: 'San Francisco, CA',
            rating: 4.9,
            completedJobs: 45,
          },
        ]}
        loading={true}
      />
    </div>
  ),
};

