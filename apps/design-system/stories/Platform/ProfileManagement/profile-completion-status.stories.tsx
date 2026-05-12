import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProfileCompletionStatus } from '@welpco/ui/platform/profile-management';

const meta = {
  title: 'Platform/ProfileManagement/ProfileCompletionStatus',
  component: ProfileCompletionStatus,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ProfileCompletionStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomerIncomplete: Story = {
  render: () => (
    <div style={{ width: '600px' }}>
      <ProfileCompletionStatus
        profileType="customer"
        steps={[
          { id: 'name', label: 'Name', completed: true, required: true, description: 'First name and last name' },
          { id: 'phone', label: 'Phone number', completed: true, required: true, description: 'Valid phone number' },
          { id: 'address', label: 'Address', completed: false, required: true, description: 'Complete address (street, city, state, zip)' },
        ]}
        onCompleteStep={(stepId) => {
          console.log('Complete step:', stepId);
        }}
      />
    </div>
  ),
};

export const CustomerComplete: Story = {
  render: () => (
    <div style={{ width: '600px' }}>
      <ProfileCompletionStatus
        profileType="customer"
        steps={[
          { id: 'name', label: 'Name', completed: true, required: true, description: 'First name and last name' },
          { id: 'phone', label: 'Phone number', completed: true, required: true, description: 'Valid phone number' },
          { id: 'address', label: 'Address', completed: true, required: true, description: 'Complete address (street, city, state, zip)' },
        ]}
        onCompleteStep={(stepId) => {
          console.log('Complete step:', stepId);
        }}
      />
    </div>
  ),
};

export const WelperIncomplete: Story = {
  render: () => (
    <div style={{ width: '600px' }}>
      <ProfileCompletionStatus
        profileType="welper"
        steps={[
          { id: 'bio', label: 'Bio', completed: true, required: true, description: 'At least 50 characters describing your expertise' },
          { id: 'photo', label: 'Profile photo', completed: true, required: true, description: 'Clear photo of yourself' },
          { id: 'service-area', label: 'Service area', completed: true, required: true, description: 'Geographic area where you provide services' },
          { id: 'hourly-rate', label: 'Hourly rate', completed: true, required: true, description: 'Default hourly rate for services' },
          { id: 'service-offerings', label: 'Service offerings', completed: false, required: true, description: 'At least one active service offering' },
        ]}
        onCompleteStep={(stepId) => {
          console.log('Complete step:', stepId);
        }}
      />
    </div>
  ),
};

export const WelperComplete: Story = {
  render: () => (
    <div style={{ width: '600px' }}>
      <ProfileCompletionStatus
        profileType="welper"
        steps={[
          { id: 'bio', label: 'Bio', completed: true, required: true, description: 'At least 50 characters describing your expertise' },
          { id: 'photo', label: 'Profile photo', completed: true, required: true, description: 'Clear photo of yourself' },
          { id: 'service-area', label: 'Service area', completed: true, required: true, description: 'Geographic area where you provide services' },
          { id: 'hourly-rate', label: 'Hourly rate', completed: true, required: true, description: 'Default hourly rate for services' },
          { id: 'service-offerings', label: 'Service offerings', completed: true, required: true, description: 'At least one active service offering' },
        ]}
        onCompleteStep={(stepId) => {
          console.log('Complete step:', stepId);
        }}
      />
    </div>
  ),
};

export const WithOptionalSteps: Story = {
  render: () => (
    <div style={{ width: '600px' }}>
      <ProfileCompletionStatus
        profileType="welper"
        steps={[
          { id: 'bio', label: 'Bio', completed: true, required: true, description: 'At least 50 characters describing your expertise' },
          { id: 'photo', label: 'Profile photo', completed: true, required: true, description: 'Clear photo of yourself' },
          { id: 'service-area', label: 'Service area', completed: true, required: true, description: 'Geographic area where you provide services' },
          { id: 'hourly-rate', label: 'Hourly rate', completed: true, required: true, description: 'Default hourly rate for services' },
          { id: 'service-offerings', label: 'Service offerings', completed: true, required: true, description: 'At least one active service offering' },
          { id: 'certifications', label: 'Certifications', completed: false, required: false, description: 'Add professional certifications (optional)' },
          { id: 'references', label: 'References', completed: false, required: false, description: 'Add professional references (optional)' },
        ]}
        onCompleteStep={(stepId) => {
          console.log('Complete step:', stepId);
        }}
      />
    </div>
  ),
};
