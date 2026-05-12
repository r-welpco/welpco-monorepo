import type { Meta, StoryObj } from '@storybook/react-vite';
import { EvidenceUpload } from '@welpco/ui';

const meta = {
  title: 'Platform/DisputeResolution/EvidenceUpload',
  component: EvidenceUpload,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof EvidenceUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onFilesChange: (files) => console.log('Files changed', files),
  },
};

export const WithFiles: Story = {
  args: {
    files: [
      {
        id: '1',
        name: 'receipt.pdf',
        size: 245760,
        type: 'application/pdf',
      },
      {
        id: '2',
        name: 'photo.jpg',
        size: 1024000,
        type: 'image/jpeg',
      },
    ],
    onFilesChange: (files) => console.log('Files changed', files),
    onRemove: (id) => console.log('Remove', id),
  },
};

export const MaxFiles: Story = {
  args: {
    files: [
      { id: '1', name: 'file1.pdf', size: 100000, type: 'application/pdf' },
      { id: '2', name: 'file2.pdf', size: 100000, type: 'application/pdf' },
      { id: '3', name: 'file3.pdf', size: 100000, type: 'application/pdf' },
      { id: '4', name: 'file4.pdf', size: 100000, type: 'application/pdf' },
      { id: '5', name: 'file5.pdf', size: 100000, type: 'application/pdf' },
    ],
    maxFiles: 5,
  },
};

