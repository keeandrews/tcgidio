import React, { useState } from 'react'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Link from '@mui/material/Link'
import { Link as RouterLink } from 'react-router-dom'

export default function SignIn() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('https://tcgid.io/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      const responseData = await response.json()
      console.log('Login response:', responseData)
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  const isFormValid = () => {
    return formData.username && formData.password
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
          Sign In
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Stack spacing={3}>
            <TextField
              required
              fullWidth
              id="username"
              name="username"
              label="Username"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
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
            />
            <Box sx={{ textAlign: 'right', mt: -1 }}>
              <Link component={RouterLink} to="/forgot-password" underline="hover" variant="body2">
                Forgot password?
              </Link>
            </Box>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              sx={{ mt: 2 }}
              disabled={!isFormValid()}
            >
              Sign In
            </Button>
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" underline="hover">
                  Sign up
                </Link>
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}

