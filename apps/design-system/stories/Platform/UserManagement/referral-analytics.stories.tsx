import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferralAnalytics } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/ReferralAnalytics',
  component: ReferralAnalytics,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ReferralAnalytics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    totalReferrals: 12,
    completedReferrals: 8,
    pendingReferrals: 4,
    rewardsEarned: '$120.00',
    referralHistory: [
      {
        id: '1',
        refereeEmail: 'user1@example.com',
        status: 'completed',
        date: '2024-01-15',
        reward: '$15.00',
      },
      {
        id: '2',
        refereeEmail: 'user2@example.com',
        status: 'pending',
        date: '2024-01-20',
      },
      {
        id: '3',
        refereeEmail: 'user3@example.com',
        status: 'rewarded',
        date: '2024-01-18',
        reward: '$15.00',
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    rewardsEarned: '$0.00',
    referralHistory: [],
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    totalReferrals: 0,
    completedReferrals: 0,
    pendingReferrals: 0,
    rewardsEarned: '$0.00',
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  args: {
    totalReferrals: 12,
    completedReferrals: 8,
    pendingReferrals: 4,
    rewardsEarned: '$120.00',
    referralHistory: [
      {
        id: '1',
        refereeEmail: 'user1@example.com',
        status: 'completed',
        date: '2024-01-15',
        reward: '$15.00',
      },
      {
        id: '2',
        refereeEmail: 'user2@example.com',
        status: 'pending',
        date: '2024-01-20',
      },
      {
        id: '3',
        refereeEmail: 'user3@example.com',
        status: 'rewarded',
        date: '2024-01-18',
        reward: '$15.00',
      },
    ],
  },
};

