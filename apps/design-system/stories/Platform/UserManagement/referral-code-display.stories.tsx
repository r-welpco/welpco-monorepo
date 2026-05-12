import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferralCodeDisplay } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/ReferralCodeDisplay',
  component: ReferralCodeDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ReferralCodeDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    referralCode: 'WELP2024',
    referralLink: 'https://welpco.com/register?ref=WELP2024',
    onCopy: (code) => console.log('Copied:', code),
    onShare: (link) => console.log('Shared:', link),
  },
};

export const Loading: Story = {
  args: {
    referralCode: 'WELP2024',
    loading: true,
  },
};

export const WithoutLink: Story = {
  args: {
    referralCode: 'WELP2024',
    onCopy: (code) => console.log('Copied:', code),
  },
};

