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
  },
  shape: {
    borderRadius: 10,
  },
})

export default theme


