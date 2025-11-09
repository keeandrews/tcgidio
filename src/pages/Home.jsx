import React, { useState, useEffect } from 'react'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const checkAuthentication = () => {
    const token = localStorage.getItem('token')
    const claimsStr = localStorage.getItem('userClaims')
    
    if (token && claimsStr) {
      try {
        const claims = JSON.parse(claimsStr)
        // Check if token is expired
        if (claims.exp && claims.exp * 1000 > Date.now()) {
          setIsAuthenticated(true)
        } else {
          // Token expired, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('userClaims')
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error parsing user claims:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('userClaims')
        setIsAuthenticated(false)
      }
    } else {
      setIsAuthenticated(false)
    }
  }

  useEffect(() => {
    // Check authentication on mount
    checkAuthentication()

    // Listen for storage changes (e.g., when user logs in/out in another tab)
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'userClaims') {
        checkAuthentication()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Also listen for custom event for same-tab updates
    const handleAuthChange = () => {
      checkAuthentication()
    }

    window.addEventListener('authStateChange', handleAuthChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('authStateChange', handleAuthChange)
    }
  }, [])

  const handleLinkEbayClick = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No auth token found')
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
        console.error('Unexpected response from start endpoint', json)
      }
    } catch (error) {
      console.error('Error connecting to eBay:', error)
    }
  }

  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome
      </Typography>
      <Box>
        <Typography>
          This is the home page.
        </Typography>
        
      </Box>
    </Paper>
  )
}


