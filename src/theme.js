import { createTheme } from '@mui/material/styles'

// Single source of truth for site-wide theming
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
    background: {
      default: '#fafafa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      '@media (max-width:900px)': {
        fontSize: '2rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.75rem',
      },
    },
    h2: {
      fontSize: '2rem',
      '@media (max-width:900px)': {
        fontSize: '1.75rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h3: {
      fontSize: '1.75rem',
      '@media (max-width:900px)': {
        fontSize: '1.5rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h4: {
      fontSize: '1.5rem',
      '@media (max-width:900px)': {
        fontSize: '1.35rem',
      },
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
  },
  shape: {
    borderRadius: 10,
  },
  breakpoints: {
    values: {
      xs: 0,     // Mobile: 0-599px
      sm: 600,   // Tablet: 600-899px
      md: 900,   // Desktop: 900px+
      lg: 1200,
      xl: 1536,
    },
  },
})

export default theme


