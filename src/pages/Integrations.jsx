import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import CircularProgress from '@mui/material/CircularProgress'
import CancelIcon from '@mui/icons-material/Cancel'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import HomeIcon from '@mui/icons-material/Home'
import RefreshIcon from '@mui/icons-material/Refresh'

export default function Integrations() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const ebayStatus = searchParams.get('ebay')
  const [error, setError] = useState(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [integration, setIntegration] = useState(null)

  const handleLinkEbayClick = async () => {
    try {
      setError(null)
      const token = localStorage.getItem('token')
      if (!token) {
        setError('You must be signed in to link your eBay account.')
        return
      }

      const res = await fetch('https://tcgid.io/api/auth/ebay/start', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json()

      if (json?.success && json?.data?.authorizationUrl) {
        window.location.href = json.data.authorizationUrl
      } else {
        setError('Unable to start eBay linking. Please try again.')
      }
    } catch (e) {
      setError('Unable to start eBay linking. Please try again.')
    }
  }

  useEffect(() => {
    // Only fetch integration status on the default integrations view
    if (ebayStatus) return
    const token = localStorage.getItem('token')
    if (!token) return

    let cancelled = false
    const fetchIntegration = async () => {
      try {
        setLoading(true)
        const res = await fetch('https://tcgid.io/api/auth/integrations/ebay', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!res.ok) {
          throw new Error('Failed to load eBay integration')
        }
        const json = await res.json()
        if (!cancelled) {
          if (json?.success) {
            setIntegration(json?.data || null)
          } else {
            setIntegration(null)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError('Unable to load eBay integration. Please try again later.')
          setToastOpen(true)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    fetchIntegration()
    return () => {
      cancelled = true
    }
  }, [ebayStatus])

  const formatDateTime = (iso) => {
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  // Show success message if ebay=connected
  if (ebayStatus === 'connected') {
    return (
      <Paper elevation={0} sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircleIcon 
            sx={{ 
              fontSize: 80, 
              color: 'success.main',
              mb: 2 
            }} 
          />
          <Typography variant="h4" gutterBottom>
            eBay Account Connected
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Your eBay account has been successfully connected to your account.
          </Typography>
        </Box>

        <Alert severity="success" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Your eBay account is now connected and ready to use. You can start syncing your data and managing your listings.
          </Typography>
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" paragraph>
            With your eBay account connected, you can now:
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="body2">
              {error}
            </Typography>
          </Alert>
        )}

        <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
          <Button
            variant="contained"
            onClick={handleLinkEbayClick}
          >
            Link eBay Account
          </Button>
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
          eBay
        </Typography>
        {loading && (
          <Stack direction="row" spacing={2} alignItems="center">
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Checking your eBay integration...
            </Typography>
          </Stack>
        )}

        {!loading && integration && (
          <Paper elevation={1} sx={{ p: 2, mt: 1 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                eBay account linked
              </Typography>
              <Typography variant="body2">
                Username: <strong>{integration.ebay_username}</strong>
              </Typography>
              <Typography variant="body2">
                User ID: <strong>{integration.ebay_user_id}</strong>
              </Typography>
              <Typography variant="body2">
                Linked on: <strong>{formatDateTime(integration.created_at)}</strong>
              </Typography>
              <Typography variant="body2">
                Access token expires: <strong>{formatDateTime(integration.access_token_expires_at)}</strong>
              </Typography>
              <Typography variant="body2">
                Refresh token expires: <strong>{formatDateTime(integration.refresh_token_expires_at)}</strong>
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}

        {!loading && !integration && (
          <Paper elevation={1} sx={{ p: 2, mt: 1 }}>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                No eBay account linked yet.
              </Typography>
              {error && (
                <Alert severity="error">
                  <Typography variant="body2">{error}</Typography>
                </Alert>
              )}
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handleLinkEbayClick}>
                  Link eBay Account
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )}
      </Box>

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setToastOpen(false)} severity="error" sx={{ width: '100%' }}>
          {error || 'Something went wrong. Please try again later.'}
        </Alert>
      </Snackbar>
    </Paper>
  )
}

