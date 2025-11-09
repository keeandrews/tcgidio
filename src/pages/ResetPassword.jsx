import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  })
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [token, setToken] = useState('')

  useEffect(() => {
    const tokenParam = searchParams.get('token')
    if (tokenParam) {
      setToken(tokenParam)
    } else {
      // If no token param, redirect to forgot password page
      navigate('/forgot-password')
    }
  }, [searchParams, navigate])

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      })
    }

    // Validate password matching in real-time
    if (name === 'confirmPassword' && value) {
      if (value !== formData.password) {
        setErrors({
          ...errors,
          confirmPassword: 'Passwords do not match',
        })
      } else {
        setErrors({
          ...errors,
          confirmPassword: '',
        })
      }
    }

    // Also check password match when password field changes
    if (name === 'password' && formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setErrors({
          ...errors,
          confirmPassword: 'Passwords do not match',
        })
      } else {
        setErrors({
          ...errors,
          confirmPassword: '',
        })
      }
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setSnackbarMessage('Please complete the form')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
      return
    }

    try {
      const response = await fetch('https://tcgid.io/api/auth/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: formData.password,
        }),
      })

      let responseData = null
      try {
        responseData = await response.json()
      } catch (e) {
        responseData = null
      }

      if (response.status === 200 && responseData?.success === true) {
        // 200 response with success: true - redirect to signin with green toast
        navigate('/signin', {
          state: {
            toastMessage: 'Password has been changed successfully',
            toastSeverity: 'success',
          },
        })
      } else if (response.status === 400) {
        // 400 response - show red toast about completing the form
        setSnackbarMessage('Please complete the form')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      } else {
        // Any other error response - show red toast about trying again later
        setSnackbarMessage('There was an error. Please try again later.')
        setSnackbarSeverity('error')
        setSnackbarOpen(true)
      }
    } catch (error) {
      console.error('Reset password error:', error)
      // Network or other errors
      setSnackbarMessage('There was an error. Please try again later.')
      setSnackbarSeverity('error')
      setSnackbarOpen(true)
    }
  }

  const isFormValid = () => {
    return (
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      !errors.password &&
      !errors.confirmPassword
    )
  }

  if (!token) {
    return null // Will redirect if no token
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '60vh',
      }}
    >
      <Paper elevation={3} sx={{ p: 4, maxWidth: 500, width: '100%' }}>
        <Typography variant="h4" gutterBottom align="center">
          Reset Password
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={3}>
            <Typography variant="body1" align="center" sx={{ mb: 2 }}>
              Please enter your new password below.
            </Typography>

            <TextField
              required
              fullWidth
              id="password"
              name="password"
              label="New Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors.password}
            />

            <TextField
              required
              fullWidth
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2 }}
              disabled={!isFormValid()}
            >
              Reset Password
            </Button>
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

