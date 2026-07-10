import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchFiltersSidebar } from '@welpco/ui';

const categoryOptions = [
  { id: 'care', name: 'Care' },
  { id: 'pet-care', name: 'Pet Care' },
  { id: 'home-cleaning', name: 'Home Cleaning' },
  { id: 'learning', name: 'Learning & Lessons' },
];

const meta = {
  title: 'Platform/ServiceDiscovery/SearchFiltersSidebar',
  component: SearchFiltersSidebar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    value: { priceRange: 'any', rating: 'any' },
    onChange: () => {},
    onReset: () => {},
    categoryOptions,
    onCategoryChange: () => {},
    keyword: '',
    onKeywordChange: () => {},
    showRadius: false,
  },
} satisfies Meta<typeof SearchFiltersSidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The horizontal panel used on the Search Welpers page (bible §16.8: every
 *  control fills its grid column — Selects must not hug their content). */
export const Panel: Story = {
  args: { layout: 'panel' },
};

export const PanelWithActiveFilters: Story = {
  args: {
    layout: 'panel',
    value: { priceRange: '50-100', rating: '4.5' },
    categoryId: 'pet-care',
    keyword: 'dog walking',
  },
};

export const Stack: Story = {
  args: { layout: 'stack' },
};
