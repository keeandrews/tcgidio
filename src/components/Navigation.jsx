import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import { Link as RouterLink } from 'react-router-dom'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'

export default function Navigation() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userClaims, setUserClaims] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuTimeout, setMenuTimeout] = useState(null)

  const checkAuthentication = () => {
    const token = localStorage.getItem('token')
    const claimsStr = localStorage.getItem('userClaims')
    
    if (token && claimsStr) {
      try {
        const claims = JSON.parse(claimsStr)
        // Check if token is expired
        if (claims.exp && claims.exp * 1000 > Date.now()) {
          setIsAuthenticated(true)
          setUserClaims(claims)
        } else {
          // Token expired, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('userClaims')
          setIsAuthenticated(false)
          setUserClaims(null)
        }
      } catch (error) {
        console.error('Error parsing user claims:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('userClaims')
        setIsAuthenticated(false)
        setUserClaims(null)
      }
    } else {
      setIsAuthenticated(false)
      setUserClaims(null)
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
      if (menuTimeout) {
        clearTimeout(menuTimeout)
      }
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userClaims')
    setIsAuthenticated(false)
    setUserClaims(null)
    setMenuOpen(false)
    setAnchorEl(null)
    // Dispatch event to update Navigation component
    window.dispatchEvent(new Event('authStateChange'))
    navigate('/signin')
  }

  const handleMenuOpen = (event) => {
    if (menuTimeout) {
      clearTimeout(menuTimeout)
      setMenuTimeout(null)
    }
    setAnchorEl(event.currentTarget)
    setMenuOpen(true)
  }

  const handleMenuClose = () => {
    // Add a small delay before closing to allow moving mouse to menu
    const timeout = setTimeout(() => {
      setMenuOpen(false)
      setAnchorEl(null)
    }, 100)
    setMenuTimeout(timeout)
  }

  const handleMenuEnter = () => {
    if (menuTimeout) {
      clearTimeout(menuTimeout)
      setMenuTimeout(null)
    }
  }

  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          TCGIDIO
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {!isAuthenticated && (
            <>
              <Button color="inherit" component={RouterLink} to="/">Home</Button>
              <Button color="inherit" component={RouterLink} to="/about">About</Button>
              <Button color="inherit" component={RouterLink} to="/signin">Sign In</Button>
              <Button color="inherit" component={RouterLink} to="/signup">Sign Up</Button>
            </>
          )}
          {isAuthenticated && (
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{
                ml: 'auto',
                cursor: 'pointer',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
              onMouseEnter={handleMenuOpen}
              onMouseLeave={handleMenuClose}
            >
              <AccountCircleIcon sx={{ fontSize: 28 }} />
              <Typography variant="body1">
                {userClaims?.first_name || 'User'}
              </Typography>
              <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                MenuListProps={{
                  onMouseEnter: handleMenuEnter,
                  onMouseLeave: handleMenuClose,
                }}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                sx={{
                  mt: 1,
                }}
              >
                <MenuItem
                  component={RouterLink}
                  to="/"
                  onClick={handleMenuClose}
                >
                  Home
                </MenuItem>
                <MenuItem
                  component={RouterLink}
                  to="/about"
                  onClick={handleMenuClose}
                >
                  About
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  Sign Out
                </MenuItem>
              </Menu>
            </Stack>
          )}
        </Stack>
      </Toolbar>
    </AppBar>
  )
}


