import React, { useState, useEffect } from 'react'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import EditIcon from '@mui/icons-material/Edit'
import RefreshIcon from '@mui/icons-material/Refresh'
import DeleteIcon from '@mui/icons-material/Delete'
import CircularProgress from '@mui/material/CircularProgress'

export default function Account() {
  const [userClaims, setUserClaims] = useState(null)
  const [balance, setBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState(null)
  const [toastOpen, setToastOpen] = useState(false)
  const [integrationLoading, setIntegrationLoading] = useState(false)
  const [integration, setIntegration] = useState(null)
  const [integrationError, setIntegrationError] = useState(null)
  const [integrationToastOpen, setIntegrationToastOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchIntegration = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      setIntegrationLoading(true)
      setIntegrationError(null)
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
      if (json?.success) {
        setIntegration(json?.data || null)
      } else {
        setIntegration(null)
      }
    } catch (e) {
      setIntegrationError('Unable to load eBay integration. Please try again later.')
      setIntegrationToastOpen(true)
    } finally {
      setIntegrationLoading(false)
    }
  }

  useEffect(() => {
    // Get user claims from localStorage
    const claimsStr = localStorage.getItem('userClaims')
    if (claimsStr) {
      try {
        const claims = JSON.parse(claimsStr)
        setUserClaims(claims)
      } catch (error) {
        console.error('Error parsing user claims:', error)
      }
    }

    // Fetch balance
    fetchBalance()
    // Fetch integration
    fetchIntegration()
  }, [])

  const fetchBalance = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setBalance(null)
      return
    }

    setBalanceLoading(true)
    setBalanceError(null)

    try {
      const response = await fetch('https://tcgid.io/api/transactions/balance', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch balance: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setBalance(data.data.balance)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Error fetching balance:', error)
      setBalanceError(error.message)
      setBalance(null)
    } finally {
      setBalanceLoading(false)
    }
  }

  // Placeholder handlers (no functionality for now)
  const showToast = () => {
    setToastOpen(true)
  }

  const handleEditPersonalInfo = () => {
    showToast()
  }

  const handleAddCredits = () => {
    showToast()
  }

  const handleUpgradePlan = () => {
    showToast()
  }

  const handleCloseAccount = () => {
    showToast()
  }

  const handleCloseToast = () => {
    setToastOpen(false)
  }

  const handleCloseIntegrationToast = () => {
    setIntegrationToastOpen(false)
  }

  const formatDateTime = (iso) => {
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  const handleLinkEbayClick = async () => {
    try {
      setIntegrationError(null)
      const token = localStorage.getItem('token')
      if (!token) {
        setIntegrationError('You must be signed in to link your eBay account.')
        setIntegrationToastOpen(true)
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
        setIntegrationError('Unable to start eBay linking. Please try again.')
        setIntegrationToastOpen(true)
      }
    } catch (e) {
      setIntegrationError('Unable to start eBay linking. Please try again.')
      setIntegrationToastOpen(true)
    }
  }

  const handleDeleteEbayClick = async () => {
    try {
      setIntegrationError(null)
      const token = localStorage.getItem('token')
      if (!token) {
        setIntegrationError('You must be signed in to unlink your eBay account.')
        setIntegrationToastOpen(true)
        return
      }

      setDeleting(true)
      const res = await fetch('https://tcgid.io/api/auth/integrations/ebay', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Failed to disconnect eBay integration')
      }
      const json = await res.json()
      if (json?.success) {
        const confirmRes = await fetch('https://tcgid.io/api/auth/integrations/ebay', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        if (!confirmRes.ok) {
          throw new Error('Failed to verify integration removal')
        }
        const confirmJson = await confirmRes.json()
        if (confirmJson?.success && !confirmJson?.data) {
          setIntegration(null)
        } else {
          setIntegration(confirmJson?.data || null)
        }
      } else {
        throw new Error('Failed to disconnect eBay integration')
      }
    } catch (e) {
      setIntegrationError('Unable to disconnect eBay integration. Please try again later.')
      setIntegrationToastOpen(true)
    } finally {
      setDeleting(false)
    }
  }

  const handleRefreshIntegration = () => {
    fetchIntegration()
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2
      }}
    >
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
        }}
      >
        Account Settings
      </Typography>

      <Box sx={{ mt: { xs: 3, sm: 4 } }}>
        {/* Personal Information Section */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="personal-info-content"
            id="personal-info-header"
            sx={{
              '& .MuiAccordionSummary-content': {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              },
            }}
          >
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Personal Information
            </Typography>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation()
                handleEditPersonalInfo()
              }}
              sx={{
                ml: 2,
                color: 'primary.main',
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  First Name
                </Typography>
                <Typography variant="body1">
                  {userClaims?.first_name || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Last Name
                </Typography>
                <Typography variant="body1">
                  {userClaims?.last_name || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Email
                </Typography>
                <Typography variant="body1">
                  {userClaims?.email || 'N/A'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Password
                </Typography>
                <Typography variant="body1">
                  ••••••••
                </Typography>
              </Box>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Integrations Section */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="integrations-content"
            id="integrations-header"
          >
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Integrations
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box>
              <Typography 
                variant="body1" 
                color="text.secondary" 
                paragraph
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  mb: 2
                }}
              >
                Connect your accounts to enhance your experience.
              </Typography>

              <Typography 
                variant="h6" 
                gutterBottom
                sx={{
                  fontSize: { xs: '1.1rem', sm: '1.25rem' }
                }}
              >
                eBay
              </Typography>
              {integrationLoading && (
                <Stack direction="row" spacing={2} alignItems="center">
                  <CircularProgress size={20} />
                  <Typography variant="body2" color="text.secondary">
                    Checking your eBay integration...
                  </Typography>
                </Stack>
              )}

              {!integrationLoading && integration && (
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
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={2} 
                      sx={{ 
                        mt: 2,
                        '& > button': {
                          minWidth: { xs: '100%', sm: 'auto' }
                        }
                      }}
                    >
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefreshIntegration}
                        disabled={deleting}
                      >
                        Refresh
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteEbayClick}
                        disabled={deleting || integrationLoading}
                      >
                        Delete
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}

              {!integrationLoading && !integration && (
                <Paper elevation={1} sx={{ p: 2, mt: 1 }}>
                  <Stack spacing={2}>
                    <Typography variant="body2" color="text.secondary">
                      No eBay account linked yet.
                    </Typography>
                    {integrationError && (
                      <Alert severity="error">
                        <Typography variant="body2">{integrationError}</Typography>
                      </Alert>
                    )}
                    <Stack 
                      direction={{ xs: 'column', sm: 'row' }} 
                      spacing={2}
                      sx={{
                        '& > button': {
                          minWidth: { xs: '100%', sm: 'auto' }
                        }
                      }}
                    >
                      <Button variant="contained" onClick={handleLinkEbayClick}>
                        Link eBay Account
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefreshIntegration}
                      >
                        Refresh
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Credits Section */}
        <Accordion defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="credits-content"
            id="credits-header"
          >
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Credits
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Current Balance
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {balanceLoading && <CircularProgress size={16} />}
                    <Typography variant="body1">
                      {balanceLoading 
                        ? 'Loading...' 
                        : balanceError 
                          ? 'Error loading balance' 
                          : balance !== null 
                            ? balance.toLocaleString() 
                            : 'N/A'}
                    </Typography>
                  </Stack>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAddCredits}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 'auto' },
                    alignSelf: { xs: 'stretch', sm: 'flex-end' },
                    mt: { xs: 0, sm: 2.5 }
                  }}
                >
                  Add More Credits
                </Button>
              </Stack>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                alignItems={{ xs: 'stretch', sm: 'flex-start' }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Current Plan
                  </Typography>
                  <Typography variant="body1">
                    Free Tier
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpgradePlan}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 'auto' },
                    alignSelf: { xs: 'stretch', sm: 'flex-end' },
                    mt: { xs: 0, sm: 2.5 }
                  }}
                >
                  Upgrade Plan
                </Button>
              </Stack>
            </Stack>
          </AccordionDetails>
        </Accordion>

        {/* Account Management Section */}
        <Accordion defaultExpanded>
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls="account-management-content"
            id="account-management-header"
          >
            <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
              Account Management
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Button
                variant="contained"
                color="error"
                onClick={handleCloseAccount}
                sx={{ 
                  minWidth: { xs: '100%', sm: 'auto' },
                  maxWidth: { xs: '100%', sm: '300px' }
                }}
              >
                Close Account
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity="info" sx={{ width: '100%' }}>
          Functionality not yet available
        </Alert>
      </Snackbar>

      <Snackbar
        open={integrationToastOpen}
        autoHideDuration={4000}
        onClose={handleCloseIntegrationToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseIntegrationToast} severity="error" sx={{ width: '100%' }}>
          {integrationError || 'Something went wrong. Please try again later.'}
        </Alert>
      </Snackbar>
    </Paper>
  )
}

