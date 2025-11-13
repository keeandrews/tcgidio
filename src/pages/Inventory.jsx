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
import TablePagination from '@mui/material/TablePagination'
import Checkbox from '@mui/material/Checkbox'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import SyncIcon from '@mui/icons-material/Sync'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import ClearIcon from '@mui/icons-material/Clear'
import CloseIcon from '@mui/icons-material/Close'
import Link from '@mui/material/Link'

// IndexedDB helper functions
const DB_NAME = 'InventoryDB'
const DB_VERSION = 1
const STORE_NAME = 'inventory'

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
  })
}

const saveToIndexedDB = async (key, value) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.put(value, key)
    
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

const getFromIndexedDB = async (key) => {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(key)
    
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// Memoized table row component for performance
const InventoryRow = React.memo(({ row, isItemSelected, handleClick }) => {
  return (
    <TableRow
      hover
      onClick={() => handleClick(row.id)}
      role="checkbox"
      aria-checked={isItemSelected}
      selected={isItemSelected}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell padding="checkbox">
        <Checkbox checked={isItemSelected} />
      </TableCell>
      <TableCell>
        <Box
          component="img"
          src={row.picture_gallery_url}
          alt={row.title}
          sx={{
            width: 60,
            height: 60,
            objectFit: 'contain',
            borderRadius: 1,
          }}
          onError={(e) => {
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="60" height="60"><rect fill="%23ddd" width="60" height="60"/></svg>'
          }}
        />
      </TableCell>
      <TableCell>
        <Link
          href={row.listing_view_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          sx={{
            textDecoration: 'none',
            color: 'primary.main',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
            {row.title}
          </Typography>
        </Link>
      </TableCell>
      <TableCell>{row.sku}</TableCell>
      <TableCell>{row.item_id}</TableCell>
      <TableCell>
        ${parseFloat(row.current_price_value || 0).toFixed(2)}
      </TableCell>
      <TableCell>{row.quantity_available}</TableCell>
      <TableCell>
        <Chip 
          label={row.listing_type === 'FixedPriceItem' ? 'Buy It Now' : row.listing_type} 
          size="small"
          variant="outlined"
        />
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
  const [orderBy, setOrderBy] = useState('title')
  const [order, setOrder] = useState('asc')
  const [selected, setSelected] = useState([])
  const [lastUpdated, setLastUpdated] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [polling, setPolling] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [showSelectedOnly, setShowSelectedOnly] = useState(false)
  const [pollingIntervalId, setPollingIntervalId] = useState(null)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
    }
  }, [navigate])

  // Only fetch initial inventory on page load (no continuous polling)
  useEffect(() => {
    const fetchInitialInventory = async () => {
      const token = localStorage.getItem('token')
      if (!token) return

      try {
        console.log('Fetching initial inventory metadata from API...')
        const response = await fetch('https://tcgid.io/api/inventory/ebay', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json()
        console.log('Inventory API Response:', data)

        if (response.ok && data.success && data.data?.url && data.data?.job_id) {
          const { url, job_id, updated_at } = data.data
          console.log('Job ID:', job_id)

          // Check if we already have this inventory cached
          const cachedJobId = localStorage.getItem('inventory_job_id')
          console.log('Cached Job ID:', cachedJobId)

          if (cachedJobId === job_id) {
            console.log('Inventory already cached, skipping download')
            return
          }

          // Download the inventory JSON from presigned URL
          console.log('Downloading inventory from presigned URL...')
          try {
            const inventoryResponse = await fetch(url, {
              mode: 'cors',
              credentials: 'omit',
            })

            if (inventoryResponse.ok) {
              const inventoryData = await inventoryResponse.json()
              console.log('Inventory data downloaded successfully')
              console.log('Number of items:', inventoryData.length)

              // Save to IndexedDB (can handle large datasets)
              try {
                await saveToIndexedDB(`${job_id}.json`, inventoryData)
                localStorage.setItem('inventory_job_id', job_id)
                localStorage.setItem('inventory_updated_at', updated_at)
                console.log('Inventory saved to IndexedDB successfully')

                // Reload inventory to display
                await loadInventory()
              } catch (saveError) {
                console.error('Error saving to IndexedDB:', saveError)
                showSnackbar('Failed to save inventory to storage', 'error')
              }
            }
          } catch (corsError) {
            console.error('CORS error downloading inventory:', corsError)
          }
        }
      } catch (error) {
        console.error('Error fetching presigned URL:', error)
      }
    }

    fetchInitialInventory()
  }, [])

  // Load inventory from IndexedDB
  useEffect(() => {
    loadInventory()
  }, [])

  const loadInventory = async () => {
    const jobId = localStorage.getItem('inventory_job_id')
    const updatedAt = localStorage.getItem('inventory_updated_at')
    
    if (jobId) {
      try {
        const data = await getFromIndexedDB(`${jobId}.json`)
        if (data) {
          console.log('Loaded inventory from IndexedDB:', data.length, 'items')
          setInventoryData(data)
          setFilteredData(data)
          setLastUpdated(updatedAt)
        }
      } catch (error) {
        console.error('Error loading inventory from IndexedDB:', error)
      }
    }
    setLoading(false)
  }

  // Filter and search with debouncing (preserves selections)
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      let dataToFilter = inventoryData

      // If showing selected only, filter to selected items first
      if (showSelectedOnly) {
        dataToFilter = inventoryData.filter((item) => selected.includes(item.id))
      }

      // Apply search query
      if (!searchQuery.trim()) {
        setFilteredData(dataToFilter)
        setPage(0)
        return
      }

      const query = searchQuery.toLowerCase()
      const filtered = dataToFilter.filter((item) => {
        return (
          item.title?.toLowerCase().includes(query) ||
          item.sku?.toLowerCase().includes(query) ||
          item.item_id?.toLowerCase().includes(query) ||
          item.current_price_value?.toString().includes(query)
        )
      })
      setFilteredData(filtered)
      setPage(0)
    }, 300) // 300ms debounce

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, inventoryData, showSelectedOnly, selected])

  // Sorting
  const sortedData = useMemo(() => {
    const comparator = (a, b) => {
      let aValue = a[orderBy]
      let bValue = b[orderBy]

      // Handle numeric values
      if (orderBy === 'current_price_value' || orderBy === 'quantity' || orderBy === 'quantity_available') {
        aValue = parseFloat(aValue) || 0
        bValue = parseFloat(bValue) || 0
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

  // Paginated data - only render current page
  const paginatedData = useMemo(() => {
    const startIndex = page * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return sortedData.slice(startIndex, endIndex)
  }, [sortedData, page, rowsPerPage])

  const handleRequestSort = useCallback((property) => {
    setOrder((prevOrder) => {
      const isAsc = orderBy === property && prevOrder === 'asc'
      return isAsc ? 'desc' : 'asc'
    })
    setOrderBy(property)
  }, [orderBy])

  const handleSelectAllClick = useCallback((event) => {
    if (event.target.checked) {
      const newSelected = paginatedData.map((item) => item.id)
      setSelected((prev) => [...new Set([...prev, ...newSelected])])
      return
    }
    // Only deselect items on current page
    const currentPageIds = paginatedData.map((item) => item.id)
    setSelected((prev) => prev.filter(id => !currentPageIds.includes(id)))
  }, [paginatedData])

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

  const isSelected = useCallback((id) => selected.indexOf(id) !== -1, [selected])

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage)
  }, [])

  const handleChangeRowsPerPage = useCallback((event) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }, [])

  const handleSync = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      showSnackbar('Please sign in to sync inventory', 'error')
      navigate('/signin')
      return
    }

    setSyncing(true)
    try {
      const response = await fetch('https://tcgid.io/api/inventory/ebay/sync', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        showSnackbar('Sync started successfully', 'info')
        // Start polling for updates
        startPolling()
      } else {
        // Handle error or existing job
        if (data.data?.message?.includes('already exists')) {
          showSnackbar('Sync already in progress', 'info')
          // Start polling anyway
          startPolling()
        } else {
          showSnackbar(data.data?.message || 'Failed to start sync', 'error')
          setSyncing(false)
        }
      }
    } catch (error) {
      console.error('Sync error:', error)
      showSnackbar('Network error during sync', 'error')
      setSyncing(false)
    }
  }

  const startPolling = useCallback(() => {
    // Clear any existing polling interval
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId)
    }

    const currentJobId = localStorage.getItem('inventory_job_id')
    setPolling(true)
    
    const pollInterval = setInterval(async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        clearInterval(pollInterval)
        setPollingIntervalId(null)
        setPolling(false)
        setSyncing(false)
        return
      }

      try {
        const response = await fetch('https://tcgid.io/api/inventory/ebay', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data?.job_id && data.data.job_id !== currentJobId) {
            // New inventory available!
            clearInterval(pollInterval)
            setPollingIntervalId(null)
            
            // Download new inventory
            try {
              const inventoryResponse = await fetch(data.data.url, {
                mode: 'cors',
                credentials: 'omit',
              })
              if (inventoryResponse.ok) {
                const inventoryData = await inventoryResponse.json()
                // Save to IndexedDB
                try {
                  await saveToIndexedDB(`${data.data.job_id}.json`, inventoryData)
                  localStorage.setItem('inventory_job_id', data.data.job_id)
                  localStorage.setItem('inventory_updated_at', data.data.updated_at)
                  
                  // Reload inventory
                  await loadInventory()
                  showSnackbar('Inventory synced successfully!', 'success')
                } catch (saveError) {
                  console.error('Error saving to IndexedDB:', saveError)
                  showSnackbar('Failed to save inventory to storage', 'error')
                }
              }
            } catch (corsError) {
              showSnackbar('CORS error: S3 bucket may not be configured for this origin', 'error')
            }
            
            setPolling(false)
            setSyncing(false)
          }
        } else {
          // Error response
          const errorData = await response.json()
          showSnackbar(errorData.data?.message || 'Error checking sync status', 'error')
          clearInterval(pollInterval)
          setPollingIntervalId(null)
          setPolling(false)
          setSyncing(false)
        }
      } catch (error) {
        console.error('Polling error:', error)
        clearInterval(pollInterval)
        setPollingIntervalId(null)
        setPolling(false)
        setSyncing(false)
      }
    }, 30000) // Poll every 30 seconds

    // Store interval ID in state
    setPollingIntervalId(pollInterval)
  }, [pollingIntervalId])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId)
      }
    }
  }, [pollingIntervalId])

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    try {
      const date = new Date(dateString)
      return date.toLocaleString()
    } catch (error) {
      return dateString
    }
  }

  const columns = [
    { id: 'picture_gallery_url', label: 'Image', sortable: false, width: 80 },
    { id: 'title', label: 'Title', sortable: true, width: 300 },
    { id: 'sku', label: 'SKU', sortable: true, width: 100 },
    { id: 'item_id', label: 'Item ID', sortable: true, width: 120 },
    { id: 'current_price_value', label: 'Price', sortable: true, width: 100 },
    { id: 'quantity_available', label: 'Qty', sortable: true, width: 80 },
    { id: 'listing_type', label: 'Type', sortable: true, width: 120 },
  ]

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: { xs: '40vh', sm: '60vh' } }}>
        <CircularProgress />
      </Box>
    )
  }

  if (inventoryData.length === 0 && !syncing) {
    return (
      <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
        <Paper 
          elevation={3} 
          sx={{ 
            p: { xs: 2, sm: 3, md: 4 }, 
            textAlign: 'center',
            borderRadius: 2
          }}
        >
          <Typography 
            variant="h5" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            No Inventory Found
          </Typography>
          <Typography 
            variant="body1" 
            color="text.secondary" 
            sx={{ 
              mb: 3,
              fontSize: { xs: '0.9rem', sm: '1rem' }
            }}
          >
            Click the sync button below to fetch your inventory from eBay
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
            onClick={handleSync}
            disabled={syncing}
            size="large"
          >
            {syncing ? 'Syncing...' : 'Sync Inventory'}
          </Button>
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
          p: { xs: 1.5, sm: 2 }, 
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
            placeholder={showSelectedOnly ? "Search selected items..." : "Search inventory..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => setShowSelectedOnly(false)}
            size="small"
            sx={{ 
              flexGrow: 1, 
              minWidth: { xs: '100%', sm: 200 },
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
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 1, sm: 2 }} 
            alignItems="center"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant="contained"
              color="secondary"
              startIcon={<CloudUploadIcon />}
              disabled={selected.length === 0}
              onClick={() => showSnackbar('Import functionality coming soon!', 'info')}
              size="small"
              fullWidth={{ xs: true, sm: false }}
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              Import
            </Button>
            <Tooltip title="Last updated">
              <Chip 
                label={`Updated: ${formatDate(lastUpdated)}`} 
                size="small"
                color="default"
                sx={{
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: { xs: 'none', sm: 'flex' }
                }}
              />
            </Tooltip>
            <Button
              variant="contained"
              color="primary"
              startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
              onClick={handleSync}
              disabled={syncing || polling}
              size="small"
              fullWidth={{ xs: true, sm: false }}
              sx={{
                fontSize: { xs: '0.8rem', sm: '0.875rem' }
              }}
            >
              {syncing ? 'Syncing...' : 'Sync Inventory'}
            </Button>
          </Stack>
        </Stack>
        {selected.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Chip 
              label={`${selected.length} items selected`} 
              color="primary"
              onClick={() => {
                setShowSelectedOnly(true)
                setSearchQuery('')
              }}
              onDelete={() => {
                setSelected([])
                setShowSelectedOnly(false)
              }}
              deleteIcon={<CloseIcon />}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        )}
      </Paper>

      {/* Table */}
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
            minWidth: { xs: 600, sm: 750 },
            '& .MuiTableCell-root': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              py: { xs: 1, sm: 1.5 }
            }
          }}
        >
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selected.length > 0 && 
                    paginatedData.some(row => selected.includes(row.id)) &&
                    !paginatedData.every(row => selected.includes(row.id))
                  }
                  checked={paginatedData.length > 0 && paginatedData.every(row => selected.includes(row.id))}
                  onChange={handleSelectAllClick}
                />
              </TableCell>
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  sx={{ fontWeight: 'bold', minWidth: column.width }}
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
            {paginatedData.map((row) => (
              <InventoryRow
                key={row.id}
                row={row}
                isItemSelected={isSelected(row.id)}
                handleClick={handleClick}
              />
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100, 200]}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
          sx={{
            '.MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              px: { xs: 1, sm: 2 }
            },
            '.MuiTablePagination-selectLabel, .MuiTablePagination-displayedRows': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              m: { xs: 0.5, sm: 1 }
            }
          }}
        />
      </TableContainer>

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

