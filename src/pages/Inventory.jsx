import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'
import Checkbox from '@mui/material/Checkbox'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import CloseIcon from '@mui/icons-material/Close'
import EditIcon from '@mui/icons-material/Edit'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import Stack from '@mui/material/Stack'

// Helper function to get the appropriate thumbnail size
const getThumbnailUrl = (imageUrl, size = '300') => {
  if (!imageUrl) return null
  
  // Check if the URL follows the expected pattern with "master.png"
  if (imageUrl.includes('/master.png')) {
    return imageUrl.replace('/master.png', `/${size}.png`)
  }
  
  // If it doesn't follow the pattern, return null to show placeholder
  return null
}

// Memoized table row component for performance
const InventoryRow = React.memo(({ row, isItemSelected, handleClick, handleEdit }) => {
  const thumbnailUrl = getThumbnailUrl(row.images?.[0], '300')
  const title = row.inventory_data?.title || 'No title'
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <TableRow
      hover
      role="checkbox"
      aria-checked={isItemSelected}
      selected={isItemSelected}
      sx={{ 
        cursor: 'pointer',
        '& .MuiTableCell-root': {
          py: { xs: 1, sm: 1.5 }
        }
      }}
    >
      <TableCell padding="checkbox" onClick={() => handleClick(row.id)}>
        <Checkbox checked={isItemSelected} />
      </TableCell>
      <TableCell padding="checkbox">
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation()
            handleEdit(row.id)
          }}
          color="primary"
          sx={{
            '&:hover': {
              backgroundColor: 'primary.light',
              color: 'primary.contrastText'
            }
          }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
      </TableCell>
      <TableCell onClick={() => handleClick(row.id)}>
        <Box
          component="img"
          src={thumbnailUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23ddd" width="60" height="60"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="10">No Image</text></svg>'}
          alt={title}
          sx={{
            width: { xs: 50, sm: 60 },
            height: { xs: 50, sm: 60 },
            objectFit: 'contain',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'divider'
          }}
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23ddd" width="60" height="60"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="10">No Image</text></svg>'
          }}
        />
      </TableCell>
      <TableCell onClick={() => handleClick(row.id)}>
        <Typography 
          variant="body2" 
          noWrap 
          sx={{ 
            maxWidth: { xs: 150, sm: 250, md: 300 },
            fontSize: { xs: '0.8rem', sm: '0.875rem' }
          }}
        >
          {title}
        </Typography>
      </TableCell>
      <TableCell 
        onClick={() => handleClick(row.id)}
        sx={{ 
          display: { xs: 'none', md: 'table-cell' }
        }}
      >
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {formatDate(row.created_at)}
        </Typography>
      </TableCell>
      <TableCell onClick={() => handleClick(row.id)}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          {formatDate(row.updated_at)}
        </Typography>
      </TableCell>
    </TableRow>
  )
})

InventoryRow.displayName = 'InventoryRow'

export default function Inventory() {
  const navigate = useNavigate()
  const [inventoryData, setInventoryData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [orderBy, setOrderBy] = useState('created_at')
  const [order, setOrder] = useState('desc')
  const [selected, setSelected] = useState([])
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
    }
  }, [navigate])

  // Fetch inventory on page load
  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch('https://tcgid.io/api/v2/inventory', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setInventoryData(data.data || [])
        setFilteredData(data.data || [])
      } else {
        showSnackbar(data.data || 'Failed to fetch inventory', 'error')
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
      showSnackbar('Network error while fetching inventory', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Filter and search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFilteredData(inventoryData)
        return
      }

      const query = searchQuery.toLowerCase()
      const filtered = inventoryData.filter((item) => {
        const title = item.inventory_data?.title || ''
        return title.toLowerCase().includes(query)
      })
      setFilteredData(filtered)
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, inventoryData])

  // Sorting
  const sortedData = useMemo(() => {
    const comparator = (a, b) => {
      let aValue, bValue

      if (orderBy === 'title') {
        aValue = a.inventory_data?.title || ''
        bValue = b.inventory_data?.title || ''
      } else if (orderBy === 'created_at' || orderBy === 'updated_at') {
        aValue = new Date(a[orderBy]).getTime()
        bValue = new Date(b[orderBy]).getTime()
      } else {
        aValue = a[orderBy]
        bValue = b[orderBy]
      }

      // Handle string values
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
      }
      if (typeof bValue === 'string') {
        bValue = bValue.toLowerCase()
      }

      if (bValue < aValue) {
        return order === 'asc' ? 1 : -1
      }
      if (bValue > aValue) {
        return order === 'asc' ? -1 : 1
      }
      return 0
    }

    return [...filteredData].sort(comparator)
  }, [filteredData, order, orderBy])

  const handleRequestSort = useCallback((property) => {
    setOrder((prevOrder) => {
      const isAsc = orderBy === property && prevOrder === 'asc'
      return isAsc ? 'desc' : 'asc'
    })
    setOrderBy(property)
  }, [orderBy])

  const handleSelectAllClick = useCallback((event) => {
    if (event.target.checked) {
      const newSelected = sortedData.map((item) => item.id)
      setSelected(newSelected)
      return
    }
    setSelected([])
  }, [sortedData])

  const handleClick = useCallback((id) => {
    setSelected((prevSelected) => {
      const selectedIndex = prevSelected.indexOf(id)
      let newSelected = []

      if (selectedIndex === -1) {
        newSelected = [...prevSelected, id]
      } else if (selectedIndex === 0) {
        newSelected = prevSelected.slice(1)
      } else if (selectedIndex === prevSelected.length - 1) {
        newSelected = prevSelected.slice(0, -1)
      } else if (selectedIndex > 0) {
        newSelected = [
          ...prevSelected.slice(0, selectedIndex),
          ...prevSelected.slice(selectedIndex + 1)
        ]
      }

      return newSelected
    })
  }, [])

  const handleEdit = (id) => {
    navigate(`/inventory/${id}`)
  }

  const isSelected = useCallback((id) => selected.indexOf(id) !== -1, [selected])

  const handleActionsClick = (event) => {
    if (selected.length === 0) {
      showSnackbar('Please select at least one item', 'warning')
      return
    }
    setAnchorEl(event.currentTarget)
  }

  const handleActionsClose = () => {
    setAnchorEl(null)
  }

  const handleMatchItems = () => {
    handleActionsClose()
    showSnackbar('Match Items functionality coming soon!', 'info')
  }

  const handleAssessConditions = () => {
    handleActionsClose()
    showSnackbar('Assess Conditions functionality coming soon!', 'info')
  }

  const handleDeleteItems = async () => {
    handleActionsClose()
    
    if (selected.length === 0) {
      showSnackbar('Please select at least one item to delete', 'warning')
      return
    }

    const confirmed = window.confirm(`Are you sure you want to delete ${selected.length} item(s)? This action cannot be undone.`)
    if (!confirmed) return

    setDeleting(true)
    const token = localStorage.getItem('token')
    if (!token) {
      showSnackbar('Authentication required', 'error')
      setDeleting(false)
      return
    }

    const deletePromises = selected.map(async (id) => {
      try {
        const response = await fetch(`https://tcgid.io/api/v2/inventory/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json()
        
        if (!response.ok || !data.success) {
          return { id, success: false, error: data.data || 'Unknown error' }
        }
        
        return { id, success: true }
      } catch (error) {
        console.error(`Error deleting item ${id}:`, error)
        return { id, success: false, error: error.message }
      }
    })

    const results = await Promise.all(deletePromises)
    const failures = results.filter(r => !r.success)
    
    setDeleting(false)
    
    // Refresh inventory
    await fetchInventory()
    
    // Clear selections
    setSelected([])
    
    // Show results
    if (failures.length > 0) {
      showSnackbar(`Failed to delete ${failures.length} item(s)`, 'error')
    } else {
      showSnackbar(`Successfully deleted ${results.length} item(s)`, 'success')
    }
  }

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const columns = [
    { id: 'checkbox', label: '', sortable: false, width: 48 },
    { id: 'edit', label: '', sortable: false, width: 48 },
    { id: 'image', label: 'Image', sortable: false, width: 80 },
    { id: 'title', label: 'Title', sortable: true, width: 250 },
    { id: 'created_at', label: 'Created', sortable: true, width: 150, hideOnMobile: true },
    { id: 'updated_at', label: 'Updated', sortable: true, width: 150 },
  ]

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: { xs: '40vh', sm: '60vh' },
          py: { xs: 2, sm: 3, md: 4 }
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
          mb: { xs: 2, sm: 3 }
        }}
      >
        Inventory Management
      </Typography>

      {/* Toolbar */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 1.5, sm: 2, md: 2.5 }, 
          mb: { xs: 2, sm: 3 },
          borderRadius: 2
        }}
      >
        <Stack 
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          <TextField
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ 
              flexGrow: 1,
              '& .MuiInputBase-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearchQuery('')}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<MoreVertIcon />}
            onClick={handleActionsClick}
            disabled={selected.length === 0 || deleting}
            size="small"
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.875rem' },
              minWidth: { xs: '100%', sm: '120px' }
            }}
          >
            Actions
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleActionsClose}
          >
            <MenuItem onClick={handleMatchItems}>Match Items</MenuItem>
            <MenuItem onClick={handleAssessConditions}>Assess Conditions</MenuItem>
            <MenuItem onClick={handleDeleteItems} sx={{ color: 'error.main' }}>
              Delete Items
            </MenuItem>
          </Menu>
        </Stack>
        {selected.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={`${selected.length} item${selected.length > 1 ? 's' : ''} selected`} 
              color="primary"
              onDelete={() => setSelected([])}
              deleteIcon={<CloseIcon />}
              size="small"
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.8125rem' }
              }}
            />
          </Box>
        )}
      </Paper>

      {/* Table */}
      {sortedData.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 3, sm: 4, md: 5 }, 
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' }
            }}
          >
            {searchQuery ? 'No items match your search' : 'No inventory items found'}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.875rem' }
            }}
          >
            {searchQuery ? 'Try adjusting your search terms' : 'Create your first inventory item to get started'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer 
          component={Paper} 
          elevation={3}
          sx={{ 
            borderRadius: 2,
            overflowX: 'auto'
          }}
        >
          <Table 
            size="small"
            sx={{
              minWidth: { xs: 500, sm: 650 },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < sortedData.length}
                    checked={sortedData.length > 0 && selected.length === sortedData.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                {columns.slice(1).map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{ 
                      fontWeight: 'bold', 
                      minWidth: column.width,
                      display: column.hideOnMobile ? { xs: 'none', md: 'table-cell' } : 'table-cell',
                      fontSize: { xs: '0.8rem', sm: '0.875rem' }
                    }}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleRequestSort(column.id)}
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedData.map((row) => (
                <InventoryRow
                  key={row.id}
                  row={row}
                  isItemSelected={isSelected(row.id)}
                  handleClick={handleClick}
                  handleEdit={handleEdit}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ 
            width: '100%',
            fontSize: { xs: '0.85rem', sm: '0.875rem' }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  )
}
