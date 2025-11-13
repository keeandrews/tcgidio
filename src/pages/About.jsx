import React from 'react'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'

export default function About() {
  return (
    <Paper 
      elevation={0} 
      sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: 2,
        maxWidth: { xs: '100%', sm: '100%', md: '800px' },
        mx: 'auto'
      }}
    >
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 }
        }}
      >
        About TCGID.IO
      </Typography>
      <Typography 
        variant="body1"
        sx={{
          fontSize: { xs: '0.9rem', sm: '1rem' },
          lineHeight: 1.6
        }}
      >
        TCGID.IO is a comprehensive platform for managing your trading card inventory. 
        Connect with eBay, sync your listings, and streamline your trading card business with our powerful tools.
      </Typography>
    </Paper>
  )
}



