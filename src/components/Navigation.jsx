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
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Drawer from '@mui/material/Drawer'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Divider from '@mui/material/Divider'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'

export default function Navigation() {
  const navigate = useNavigate()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userClaims, setUserClaims] = useState(null)
  const [anchorEl, setAnchorEl] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuTimeout, setMenuTimeout] = useState(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [balance, setBalance] = useState(null)
  const [balanceLoading, setBalanceLoading] = useState(false)
  const [balanceError, setBalanceError] = useState(null)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))

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
          // Fetch balance when authenticated
          fetchBalance()
        } else {
          // Token expired, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('userClaims')
          setIsAuthenticated(false)
          setUserClaims(null)
          setBalance(null)
        }
      } catch (error) {
        console.error('Error parsing user claims:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('userClaims')
        setIsAuthenticated(false)
        setUserClaims(null)
        setBalance(null)
      }
    } else {
      setIsAuthenticated(false)
      setUserClaims(null)
      setBalance(null)
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
    setBalance(null)
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

  const toggleMobileDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return
    }
    setMobileDrawerOpen(open)
  }

  const handleDrawerLinkClick = () => {
    setMobileDrawerOpen(false)
  }

  // Mobile drawer content
  const mobileDrawerContent = (
    <Box
      sx={{ width: 280 }}
      role="presentation"
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" color="primary">
          TCGID.IO
        </Typography>
        <IconButton onClick={toggleMobileDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {!isAuthenticated ? (
          <>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/about" onClick={handleDrawerLinkClick}>
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/signin" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Sign In" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/signup" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Sign Up" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem>
              <Stack direction="column" spacing={0.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountCircleIcon color="primary" />
                  <Typography variant="subtitle1">
                    {userClaims?.first_name || 'User'}
                  </Typography>
                </Stack>
                {balanceLoading ? (
                  <Typography variant="body2" color="text.secondary">
                    Loading balance...
                  </Typography>
                ) : balanceError ? (
                  <Typography variant="body2" color="error">
                    Error loading balance
                  </Typography>
                ) : balance !== null ? (
                  <Typography variant="body2" color="primary" fontWeight="medium">
                    Credits: {balance.toLocaleString()}
                  </Typography>
                ) : null}
              </Stack>
            </ListItem>
            <Divider />
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Home" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/about" onClick={handleDrawerLinkClick}>
                <ListItemText primary="About" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/integrations" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Integrations" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component={RouterLink} to="/inventory" onClick={handleDrawerLinkClick}>
                <ListItemText primary="Inventory" />
              </ListItemButton>
            </ListItem>
            <Divider sx={{ my: 1 }} />
            <ListItem disablePadding>
              <ListItemButton onClick={() => { handleSignOut(); handleDrawerLinkClick(); }}>
                <ListItemText primary="Sign Out" />
              </ListItemButton>
            </ListItem>
          </>
        )}
      </List>
    </Box>
  )

  return (
    <>
      <AppBar position="static" color="primary" enableColorOnDark>
        <Toolbar>
          <Box
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
          >
            <svg
              width={isMobile ? '150' : '200'}
              height="48"
              viewBox="0 0 200 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ maxWidth: '100%' }}
            >
              {/* Icon: simplified front card, subtle shadow for back card */}
              <g>
                {/* Shadow/back card outline (no overlap edges) */}
                <rect
                  x="5"
                  y="8"
                  width="20"
                  height="28"
                  rx="3"
                  fill="none"
                  stroke="rgba(255,255,255,0.35)"
                  strokeWidth="2"
                />
                {/* Main front card */}
                <rect
                  x="9"
                  y="10"
                  width="20"
                  height="28"
                  rx="3"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                {/* Circular "AI" dot */}
                <circle cx="19" cy="17" r="2.3" fill="#FFFFFF" />
                {/* Horizontal ID line */}
                <rect x="15" y="24" width="8" height="2.2" rx="1" fill="#FFFFFF" />
              </g>
              {/* Text label */}
              <text
                x="45"
                y="29"
                fill="#FFFFFF"
                fontSize="18"
                fontWeight="700"
                fontFamily="-apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                letterSpacing="1"
              >
                TCGID.IO
              </text>
            </svg>
          </Box>
          
          {/* Desktop Navigation */}
          {!isMobile && (
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
                  spacing={2}
                  alignItems="center"
                  sx={{
                    ml: 'auto',
                  }}
                >
                  {balanceLoading ? (
                    <Typography variant="body2" color="inherit" sx={{ opacity: 0.8 }}>
                      Loading...
                    </Typography>
                  ) : balanceError ? (
                    <Typography variant="body2" color="inherit" sx={{ opacity: 0.7 }}>
                      Balance unavailable
                    </Typography>
                  ) : balance !== null ? (
                    <Typography variant="body1" color="inherit" fontWeight="medium">
                      Credits: {balance.toLocaleString()}
                    </Typography>
                  ) : null}
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{
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
                  </Stack>
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
                    <MenuItem
                      component={RouterLink}
                      to="/integrations"
                      onClick={handleMenuClose}
                    >
                      Integrations
                    </MenuItem>
                    <MenuItem
                      component={RouterLink}
                      to="/inventory"
                      onClick={handleMenuClose}
                    >
                      Inventory
                    </MenuItem>
                    <MenuItem onClick={handleSignOut}>
                      Sign Out
                    </MenuItem>
                  </Menu>
                </Stack>
              )}
            </Stack>
          )}
          
          {/* Mobile Hamburger Menu */}
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open menu"
              edge="end"
              onClick={toggleMobileDrawer(true)}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>
      
      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={toggleMobileDrawer(false)}
      >
        {mobileDrawerContent}
      </Drawer>
    </>
  )
}


