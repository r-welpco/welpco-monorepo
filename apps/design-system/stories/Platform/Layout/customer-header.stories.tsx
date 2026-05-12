import type { Meta, StoryObj } from '@storybook/react-vite';
import { CustomerHeader } from '@welpco/ui/platform/layout/customer-header';
import { Box } from '@radix-ui/themes';

const meta = {
  title: 'Platform/Layout/CustomerHeader',
  component: CustomerHeader,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CustomerHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockUser = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  image: null,
};

export const Default: Story = {
  render: (args) => (
    <Box>
      <CustomerHeader {...args} />
      <Box style={{ padding: '48px', minHeight: '100vh' }}>
        <p>Page content goes here</p>
      </Box>
    </Box>
  ),
  args: {
    activeTab: 'dashboard',
    user: mockUser,
    notificationCount: 0,
    onRoleSwitch: () => console.log('Switch to Welper'),
    onSearch: (query) => console.log('Search:', query),
    onFeedbackClick: () => console.log('Feedback clicked'),
    onNotificationClick: () => console.log('Notifications clicked'),
    onDocsClick: () => console.log('Docs clicked'),
    onThemeChange: (theme) => console.log('Theme changed:', theme),
    onProfileClick: () => console.log('Profile clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
    onLogout: () => console.log('Logout clicked'),
  },
};

export const WithActiveTab: Story = {
  render: (args) => (
    <Box>
      <CustomerHeader {...args} />
      <Box style={{ padding: '48px', minHeight: '100vh' }}>
        <p>Page content goes here</p>
      </Box>
    </Box>
  ),
  args: {
    activeTab: 'bookings',
    user: mockUser,
    notificationCount: 0,
    onRoleSwitch: () => console.log('Switch to Welper'),
    onSearch: (query) => console.log('Search:', query),
    onFeedbackClick: () => console.log('Feedback clicked'),
    onNotificationClick: () => console.log('Notifications clicked'),
    onDocsClick: () => console.log('Docs clicked'),
    onThemeChange: (theme) => console.log('Theme changed:', theme),
    onProfileClick: () => console.log('Profile clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
    onLogout: () => console.log('Logout clicked'),
  },
};

export const WithNotifications: Story = {
  render: (args) => (
    <Box>
      <CustomerHeader {...args} />
      <Box style={{ padding: '48px', minHeight: '100vh' }}>
        <p>Page content goes here</p>
      </Box>
    </Box>
  ),
  args: {
    activeTab: 'dashboard',
    user: mockUser,
    notificationCount: 5,
    onRoleSwitch: () => console.log('Switch to Welper'),
    onSearch: (query) => console.log('Search:', query),
    onFeedbackClick: () => console.log('Feedback clicked'),
    onNotificationClick: () => console.log('Notifications clicked'),
    onDocsClick: () => console.log('Docs clicked'),
    onThemeChange: (theme) => console.log('Theme changed:', theme),
    onProfileClick: () => console.log('Profile clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
    onLogout: () => console.log('Logout clicked'),
  },
};

export const WithManyNotifications: Story = {
  render: (args) => (
    <Box>
      <CustomerHeader {...args} />
      <Box style={{ padding: '48px', minHeight: '100vh' }}>
        <p>Page content goes here</p>
      </Box>
    </Box>
  ),
  args: {
    activeTab: 'dashboard',
    user: mockUser,
    notificationCount: 150,
    onRoleSwitch: () => console.log('Switch to Welper'),
    onSearch: (query) => console.log('Search:', query),
    onFeedbackClick: () => console.log('Feedback clicked'),
    onNotificationClick: () => console.log('Notifications clicked'),
    onDocsClick: () => console.log('Docs clicked'),
    onThemeChange: (theme) => console.log('Theme changed:', theme),
    onProfileClick: () => console.log('Profile clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
    onLogout: () => console.log('Logout clicked'),
  },
};

export const WithoutUser: Story = {
  render: (args) => (
    <Box>
      <CustomerHeader {...args} />
      <Box style={{ padding: '48px', minHeight: '100vh' }}>
        <p>Page content goes here</p>
      </Box>
    </Box>
  ),
  args: {
    activeTab: 'dashboard',
    user: undefined,
    notificationCount: 0,
    onRoleSwitch: () => console.log('Switch to Welper'),
    onSearch: (query) => console.log('Search:', query),
    onFeedbackClick: () => console.log('Feedback clicked'),
    onNotificationClick: () => console.log('Notifications clicked'),
    onDocsClick: () => console.log('Docs clicked'),
    onThemeChange: (theme) => console.log('Theme changed:', theme),
  },
};

export const MobileView: Story = {
  render: (args) => (
    <Box>
      <CustomerHeader {...args} />
      <Box style={{ padding: '48px', minHeight: '100vh' }}>
        <p>Page content goes here</p>
      </Box>
    </Box>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
  args: {
    activeTab: 'dashboard',
    user: mockUser,
    notificationCount: 3,
    onRoleSwitch: () => console.log('Switch to Welper'),
    onSearch: (query) => console.log('Search:', query),
    onFeedbackClick: () => console.log('Feedback clicked'),
    onNotificationClick: () => console.log('Notifications clicked'),
    onDocsClick: () => console.log('Docs clicked'),
    onThemeChange: (theme) => console.log('Theme changed:', theme),
    onProfileClick: () => console.log('Profile clicked'),
    onSettingsClick: () => console.log('Settings clicked'),
    onLogout: () => console.log('Logout clicked'),
  },
};

