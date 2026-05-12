import type { Preview } from '@storybook/react-vite';
import React from 'react';
import { Theme } from '@radix-ui/themes';
import '@radix-ui/themes/styles.css';
import './preview.css';
import { VIEWPORTS } from './decorators';

const preview: Preview = {
  parameters: {
    layout: 'padded',
    viewport: {
      viewports: VIEWPORTS,
    },
    a11y: {
      // WCAG 2.1 AA compliance is the merge gate.
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'aria-valid-attr', enabled: true },
          { id: 'aria-required-attr', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'link-name', enabled: true },
          { id: 'image-alt', enabled: true },
          { id: 'landmark-one-main', enabled: false }, // component stories aren't full pages
        ],
      },
      options: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Theme appearance',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
  },
  decorators: [
    (Story, context) => {
      const appearance = (context.globals.theme as 'light' | 'dark') || 'light';
      return (
        <Theme appearance={appearance} accentColor="grass" panelBackground="translucent">
          <Story />
        </Theme>
      );
    },
  ],
};

export default preview;
