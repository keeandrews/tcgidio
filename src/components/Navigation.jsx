import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import { Link as RouterLink } from 'react-router-dom'

export default function Navigation() {
  return (
    <AppBar position="static" color="primary" enableColorOnDark>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          TCGIDIO
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/about">About</Button>
        </Stack>
      </Toolbar>
    </AppBar>
  )
}


