import React from 'react'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

export default function About() {
  return (
    <Paper elevation={0} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        About
      </Typography>
      <Typography>
        This starter uses React, Vite, React Router, and MUI with a single
        theme file at <code>src/theme.js</code>.
      </Typography>
    </Paper>
  )
}


