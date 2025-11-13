import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Link from '@mui/material/Link'
import { Link as RouterLink } from 'react-router-dom'

import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

// IndexedDB helper functions
const DB_NAME = 'InventoryDB'
const DB_VERSION = 1
const STORE_NAME = 'inventory'

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

const saveToIndexedDB = async (key, value) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(value, key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

export default function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const navigate = useNavigate()

  const location = useLocation()
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')

  useEffect(() => {
    const state = location.state
    const message = state?.toastMessage || state?.toast?.message
    const severity = state?.toastSeverity || state?.toast?.severity || 'success'
    if (message) {
      setSnackbarMessage(message)
      setSnackbarSeverity(severity)
      setSnackbarOpen(true)
      // Clear the state so the toast doesn't reappear on back/forward
      window.history.replaceState({}, document.title, location.pathname)
    }
  }, [location])

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const decodeJWT = (token) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('Error decoding JWT:', error)
      return null
    }
  }

  const fetchInventory = async (token) => {
    try {
      const response = await fetch('https://tcgid.io/api/inventory/ebay', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.url && data.data?.job_id) {
          // Check if we already have this inventory cached
          const cachedJobId = localStorage.getItem('inventory_job_id')
          if (cachedJobId === data.data.job_id) {
            // Already have this inventory, no need to re-download
            return
          }

          // Download the inventory JSON from presigned URL
          try {
            const inventoryResponse = await fetch(data.data.url, {
              mode: 'cors',
              credentials: 'omit',
            })
            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json()
              // Save to IndexedDB (can handle large datasets)
              try {
                await saveToIndexedDB(`${data.data.job_id}.json`, inventoryData)
                localStorage.setItem('inventory_job_id', data.data.job_id)
                localStorage.setItem('inventory_updated_at', data.data.updated_at)
              } catch (saveError) {
                console.error('Error saving to IndexedDB:', saveError)
              }
            }
          } catch (corsError) {
            // CORS error - likely S3 bucket not configured for localhost
            // This is expected in development, will work in production
            // Silently ignore as this is a background operation
          }
        }
      }
    } catch (error) {
      // Silently fail - this is a background operation
      // User can manually sync from inventory page if needed
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('https://tcgid.io/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      })

      const responseData = await response.json()

      if (response.ok && responseData.success && responseData.data?.token) {
        // Save token to browser storage
        localStorage.setItem('token', responseData.data.token)

        // Decode token to get claims
        const claims = decodeJWT(responseData.data.token)
        if (claims) {
          // Save claims to browser storage
          localStorage.setItem('userClaims', JSON.stringify(claims))

          // Dispatch event to update Navigation component
          window.dispatchEvent(new Event('authStateChange'))

          // Fetch inventory in the background
          fetchInventory(responseData.data.token)

          // Check email_verified status
          if (claims.email_verified === false) {
            // Redirect to verify page with email in URL
            const encodedEmail = encodeURIComponent(claims.email)
            navigate(`/verify?email=${encodedEmail}`)
          } else {
            // Redirect to homepage
            navigate('/')
          }
        } else {
          setSnackbarMessage('Error processing authentication data')
          setSnackbarSeverity('error')
          setSnackbarOpen(true)
        }
      } else {
        // Handle error response
        const errorMessage = responseData.data || responseData.message || 'Login failed. Please try again.'
        setSnackbarMessage(errorMessage)
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Login error:', error)
      setSnackbarMessage('Network error. Please try again later.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const isFormValid = () => {
    return formData.email && formData.password
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: { xs: '50vh', sm: '60vh' },
        px: { xs: 0, sm: 2 }
      }}
    >
      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          maxWidth: 500, 
          width: '100%',
          borderRadius: 2
        }}
      >
        <Typography 
          variant="h4" 
          gutterBottom 
          align="center"
          sx={{
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
          }}
        >
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: { xs: 2, sm: 3 } }}>
          <Stack spacing={{ xs: 2, sm: 3 }}>
            <TextField
              required
              fullWidth
              id="email"
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="current-password"
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
            <Box sx={{ textAlign: 'right', mt: -1 }}>
              <Link 
                component={RouterLink} 
                to="/forgot-password" 
                underline="hover" 
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Forgot password?
              </Link>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ 
                mt: 2,
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 }
              }}
              disabled={!isFormValid()}
            >
              Sign In
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography 
                variant="body2"
                sx={{
                  fontSize: { xs: '0.8rem', sm: '0.875rem' }
                }}
              >
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" underline="hover">
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}

