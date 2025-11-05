import React from 'react'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'

export default function Home() {
  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome
      </Typography>
      <Box>
        <Typography>
          This is the home page. Edit the global theme in <code>src/theme.js</code> to
          change the look and feel site-wide.
        </Typography>
      </Box>
    </Paper>
  )
}


