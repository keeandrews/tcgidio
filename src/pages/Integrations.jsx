import React from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import CancelIcon from '@mui/icons-material/Cancel'
import HomeIcon from '@mui/icons-material/Home'
import RefreshIcon from '@mui/icons-material/Refresh'

export default function Integrations() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ebayStatus = searchParams.get('ebay')

  // Show declined message if ebay=denied
  if (ebayStatus === 'denied') {
    return (
      <Paper elevation={0} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CancelIcon 
            sx={{ 
              fontSize: 80, 
              color: 'error.main',
              mb: 2 
            }} 
          />
          <Typography variant="h4" gutterBottom>
            Authorization Cancelled
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            You have cancelled the eBay account authorization process.
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            No changes have been made to your account. Your eBay account has not been connected.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            If you'd like to connect your eBay account in the future, you can do so from your account settings. 
            Connecting your eBay account allows you to:
          </Typography>
          <Box component="ul" sx={{ pl: 3, mb: 3 }}>
            <li>Access your eBay listings and data</li>
            <li>Manage your trading card inventory</li>
            <li>Sync information between platforms</li>
          </Box>
        </Box>

        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Go to Home
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              // Remove the query parameter and show the integrations page
              navigate('/integrations', { replace: true })
            }}
          >
            View Integrations
          </Button>
        </Stack>
      </Paper>
    )
  }

  // Default integrations page (if no query params or other status)
  return (
    <Paper elevation={0} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Integrations
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Connect your accounts to enhance your experience.
      </Typography>
      
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Available Integrations
        </Typography>
        <Typography variant="body1">
          Manage your connected accounts and services here.
        </Typography>
      </Box>
    </Paper>
  )
}

