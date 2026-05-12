import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfilePhotoUpload } from '@welpco/ui/platform/profile-management';
import { useState } from 'react';

const meta = {
  title: 'Platform/ProfileManagement/ProfilePhotoUpload',
  component: ProfilePhotoUpload,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProfilePhotoUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    return (
      <ProfilePhotoUpload
        currentPhotoUrl={photoUrl}
        onUpload={async (file) => {
          const url = URL.createObjectURL(file);
          setPhotoUrl(url);
        }}
        onRemove={async () => {
          setPhotoUrl(null);
        }}
      />
    );
  },
};

export const WithExistingPhoto: Story = {
  render: () => (
    <ProfilePhotoUpload
      currentPhotoUrl="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
      currentPhotoAlt="John Doe"
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <ProfilePhotoUpload
      currentPhotoUrl={null}
      loading={true}
      onUpload={async () => {}}
    />
  ),
};

export const WithValidation: Story = {
  render: () => (
    <ProfilePhotoUpload
      currentPhotoUrl={null}
      maxSizeMB={2}
      minDimensions={{ width: 300, height: 300 }}
      maxDimensions={{ width: 2000, height: 2000 }}
      acceptedFormats={['image/jpeg', 'image/png']}
      onUpload={async (file) => {
        console.log('Uploaded:', file.name);
      }}
    />
  ),
};

