// Colour tokens for the light and dark themes, consumed via useThemeTokens().

export const LIGHT_THEME = {
  colorPrimary: '#2952A3',
  colorSuccess: '#1a8754',
  colorWarning: '#c8862a',
  colorError: '#b3402f',

  colorBgLayout: '#f4f6f9',
  colorBgContainer: '#ffffff',
  colorBorder: '#e4e8ee',
  colorBorderSecondary: '#eef1f5',

  colorText: '#12233f',
  colorTextSecondary: '#5b6472',
  colorTextTertiary: '#8b8f7f',
  colorTextMuted: '#c9cdd4',

  linkMuted: '#d5dbe4',
  selectedWash: 'rgba(41,82,163,0.06)',
  cursorWash: 'rgba(41,82,163,0.06)',

  graphNode: {
    investor: '#12233f',
    fund: '#2952A3',
    stock: '#0f766e',
    sector: '#7c5295',
    sectorTop: '#b3402f',
  },

  overlapFund1: '#5b8fd4',
  overlapFund2: '#2ebc74',

  sectorPalette: ['#3b9de8', '#2ebc74', '#e8b030', '#a366e0', '#18baba', '#e85c5c', '#e05c96', '#5c8ee8', '#e87a38'],
  sectorPaletteOther: '#c9cdd4',

  avatarPalette: ['#2952A3', '#2ebc74', '#e8b030', '#a366e0', '#18baba', '#e05c96'],

  categoryTagColors: {
    'Fund of Funds': 'purple',
    'Index Fund': 'blue',
    ELSS: 'gold',
  },
};

export const DARK_THEME = {
  colorPrimary: '#6d97d6',
  colorSuccess: '#34d399',
  colorWarning: '#e8b030',
  colorError: '#f38b81',

  colorBgLayout: '#10131a',
  colorBgContainer: '#181c25',
  colorBorder: '#2b303c',
  colorBorderSecondary: '#232732',

  colorText: '#e8eaed',
  colorTextSecondary: '#9aa4b5',
  colorTextTertiary: '#6b7385',
  colorTextMuted: '#3a3f4d',

  linkMuted: '#343a48',
  selectedWash: 'rgba(109,151,214,0.12)',
  cursorWash: 'rgba(109,151,214,0.10)',

  graphNode: {
    investor: '#e8eaed',
    fund: '#6d97d6',
    stock: '#2dd4bf',
    sector: '#c084fc',
    sectorTop: '#f38b81',
  },

  overlapFund1: '#6d97d6',
  overlapFund2: '#34d399',

  sectorPalette: ['#6d9de8', '#34d399', '#f0b93e', '#b57bf0', '#2dd4bf', '#f0837a', '#e585ac', '#89aaf0', '#f0955c'],
  sectorPaletteOther: '#3a3f4d',

  avatarPalette: ['#6d97d6', '#34d399', '#f0b93e', '#b57bf0', '#2dd4bf', '#e585ac'],

  categoryTagColors: {
    'Fund of Funds': 'purple',
    'Index Fund': 'blue',
    ELSS: 'gold',
  },
};

export const THEMES = { light: LIGHT_THEME, dark: DARK_THEME };
export const THEME_STORAGE_KEY = 'plt-theme-mode';
