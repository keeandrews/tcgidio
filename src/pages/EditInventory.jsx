import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import FormControlLabel from '@mui/material/FormControlLabel'
import FormLabel from '@mui/material/FormLabel'
import CircularProgress from '@mui/material/CircularProgress'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import PsychologyIcon from '@mui/icons-material/Psychology'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'
import Autocomplete from '@mui/material/Autocomplete'
import Checkbox from '@mui/material/Checkbox'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import useEbayAspects from '../hooks/useEbayAspects'
import { 
  mapEbayAspectsToFields, 
  getVisibleOptions, 
  validateAspectValues,
  groupFieldsByCategory 
} from '../utils/mapEbayAspectsToFields'

const MAX_IMAGES = 24

// Helper function to convert master URL to specific size
const getImageUrl = (imageUrl, size = 'master') => {
  if (!imageUrl) return null
  
  if (imageUrl.includes('/master.png')) {
    return imageUrl.replace('/master.png', `/${size}.png`)
  }
  
  // If it doesn't follow the pattern, return as-is
  return imageUrl
}

// Helper function to convert any size to master
const toMasterUrl = (imageUrl) => {
  if (!imageUrl) return null
  
  // Replace any size with master
  const sizePattern = /\/(120|300|600|1600)\.png$/
  if (sizePattern.test(imageUrl)) {
    return imageUrl.replace(sizePattern, '/master.png')
  }
  
  return imageUrl
}

export default function EditInventory() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isNewItem = searchParams.get('new') === 'true'
  const fileInputRef = useRef(null)
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  // Inventory data
  const [originalData, setOriginalData] = useState(null)
  const [images, setImages] = useState([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [uploadingImages, setUploadingImages] = useState([])
  
  // Form fields
  const [formData, setFormData] = useState({
    title: '',
    game: 'Pokémon TCG',
    graded: 'No',
    professional_grader: '',
    grade: '',
    condition: '',
    card_name: '',
    character: '',
    card_type: '',
    language: '',
    finish: '',
    stage: '',
    description: ''
  })
  
  // eBay aspects state
  const [aspectValues, setAspectValues] = useState({})
  
  // Always fetch eBay aspects for category 183454
  const { aspects, loading: aspectsLoading, error: aspectsError } = useEbayAspects(183454)
  
  // Map aspects to field configs
  const aspectFields = aspects ? mapEbayAspectsToFields(aspects.aspects) : []
  const groupedAspectFields = aspects ? groupFieldsByCategory(aspectFields) : {}

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
    }
  }, [navigate])

  // Fetch inventory item details
  useEffect(() => {
    fetchInventoryItem()
  }, [id])

  const fetchInventoryItem = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch(`https://tcgid.io/api/v2/inventory/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        const item = data.data
        setOriginalData(item)
        setImages(item.images || [])
        
        // Populate form with inventory_data
        const inventoryData = item.inventory_data || {}
        setFormData({
          title: inventoryData.title || '',
          game: inventoryData.game || 'Pokémon TCG',
          graded: inventoryData.graded || 'No',
          professional_grader: inventoryData.professional_grader || '',
          grade: inventoryData.grade || '',
          condition: inventoryData.condition || '',
          card_name: inventoryData.card_name || '',
          character: inventoryData.character || '',
          card_type: inventoryData.card_type || '',
          language: inventoryData.language || '',
          finish: inventoryData.finish || '',
          stage: inventoryData.stage || '',
          description: inventoryData.description || ''
        })
        
        // Populate eBay aspects if present
        if (item.ebay_aspects || item.ebayAspects) {
          setAspectValues(item.ebay_aspects || item.ebayAspects || {})
        }
      } else {
        showSnackbar(data.data || 'Failed to fetch inventory item', 'error')
        navigate('/inventory')
      }
    } catch (error) {
      console.error('Error fetching inventory item:', error)
      showSnackbar('Network error while fetching inventory item', 'error')
      navigate('/inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setUnsavedChanges(true)
    
    // Clear dependent fields when changing graded status
    if (field === 'graded') {
      if (value === 'No') {
        setFormData(prev => ({
          ...prev,
          graded: value,
          professional_grader: '',
          grade: ''
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          graded: value,
          condition: ''
        }))
      }
    }
    
    // Clear stage field when card_type changes
    if (field === 'card_type' && value !== 'Pokémon') {
      setFormData(prev => ({ ...prev, card_type: value, stage: '' }))
    }
  }

  const handleAspectChange = (aspectName, value) => {
    setAspectValues(prev => ({ ...prev, [aspectName]: value }))
    setUnsavedChanges(true)
  }

  const handleImageSelect = (index) => {
    setSelectedImage(index)
  }

  const handleImageDelete = (index) => {
    const newImages = [...images]
    newImages.splice(index, 1)
    setImages(newImages)
    setUnsavedChanges(true)
    
    // Adjust selected image if necessary
    if (selectedImage >= newImages.length && newImages.length > 0) {
      setSelectedImage(newImages.length - 1)
    } else if (newImages.length === 0) {
      setSelectedImage(0)
    }
  }

  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(images)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setImages(items)
    setUnsavedChanges(true)
    
    // Update selected image index
    if (selectedImage === result.source.index) {
      setSelectedImage(result.destination.index)
    } else if (selectedImage > result.source.index && selectedImage <= result.destination.index) {
      setSelectedImage(selectedImage - 1)
    } else if (selectedImage < result.source.index && selectedImage >= result.destination.index) {
      setSelectedImage(selectedImage + 1)
    }
  }

  const handleFileSelect = async (event) => {
    if (!event.target.files || event.target.files.length === 0) return
    
    const files = Array.from(event.target.files)
    
    const currentTotal = images.length + uploadingImages.length
    const remainingSlots = MAX_IMAGES - currentTotal
    
    if (remainingSlots <= 0) {
      showSnackbar('Maximum of 24 images reached', 'warning')
      return
    }
    
    const filesToUpload = files.slice(0, remainingSlots)
    
    if (files.length > filesToUpload.length) {
      showSnackbar(`Only uploading ${filesToUpload.length} image(s) to stay within the 24 image limit`, 'warning')
    }
    
    // Create placeholder entries for uploading images
    const placeholders = filesToUpload.map((file, index) => ({
      id: `uploading-${Date.now()}-${index}`,
      file,
      uploading: true,
      error: false
    }))
    
    setUploadingImages(prev => [...prev, ...placeholders])
    
    // Upload each image
    for (const placeholder of placeholders) {
      await uploadImage(placeholder.file, placeholder.id)
    }
    
    // Reset input to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadImage = async (file, placeholderId) => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      // Step 1: Get presigned URL
      const presignedResponse = await fetch(
        `https://tcgid.io/api/v2/inventory/${id}?filename=${encodeURIComponent(file.name)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      const presignedData = await presignedResponse.json()

      if (!presignedResponse.ok || !presignedData.success) {
        throw new Error(presignedData.data || 'Failed to get upload URL')
      }

      const { presigned_url, content_type } = presignedData.data

      // Step 2: Upload file to S3
      const uploadResponse = await fetch(presigned_url, {
        method: 'PUT',
        headers: {
          'Content-Type': content_type,
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload image to S3')
      }

      // Step 3: Poll for the image to appear in inventory
      await pollForNewImage(placeholderId)
      
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadingImages(prev => 
        prev.map(img => 
          img.id === placeholderId 
            ? { ...img, uploading: false, error: true }
            : img
        )
      )
      showSnackbar(`Failed to upload ${file.name}`, 'error')
    }
  }

  const pollForNewImage = async (placeholderId) => {
    const token = localStorage.getItem('token')
    if (!token) return

    const startTime = Date.now()
    const timeout = 60000 // 60 seconds
    const pollInterval = 2000 // 2 seconds

    const poll = async () => {
      try {
        const response = await fetch(`https://tcgid.io/api/v2/inventory/${id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (response.ok && data.success) {
          const newImages = data.data.images || []
          
          // Check if we have new images
          if (newImages.length > images.length) {
            // Found new image(s)
            setImages(newImages)
            setUploadingImages(prev => prev.filter(img => img.id !== placeholderId))
            setUnsavedChanges(false) // Image was saved on server
            return true
          }
        }

        // Check timeout
        if (Date.now() - startTime > timeout) {
          throw new Error('Upload timeout')
        }

        // Continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval))
        return poll()
        
      } catch (error) {
        console.error('Error polling for image:', error)
        setUploadingImages(prev => 
          prev.map(img => 
            img.id === placeholderId 
              ? { ...img, uploading: false, error: true }
              : img
          )
        )
        return false
      }
    }

    await poll()
  }

  const handleSave = async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    // Validate required fields
    if (formData.title.length > 80) {
      showSnackbar('Title must be 80 characters or less', 'error')
      return
    }

    // Validate eBay aspects
    if (aspectFields.length > 0) {
      const validationErrors = validateAspectValues(aspectFields, aspectValues)
      if (validationErrors.length > 0) {
        showSnackbar(validationErrors[0], 'error')
        return
      }
    }

    setSaving(true)
    try {
      // Convert all form data to strings and build data object
      const dataToSave = {}
      Object.keys(formData).forEach(key => {
        const value = formData[key]
        if (value !== '' && value !== null && value !== undefined) {
          dataToSave[key] = String(value)
        }
      })

      // Ensure images use master URLs
      const masterImages = images.map(img => toMasterUrl(img))

      // Build request body
      const requestBody = {
        data: dataToSave,
        images: masterImages
      }

      // Include eBay aspects if any are set
      if (Object.keys(aspectValues).length > 0) {
        requestBody.ebay_aspects = aspectValues
      }

      const response = await fetch(`https://tcgid.io/api/v2/inventory/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        showSnackbar('Inventory item saved successfully', 'success')
        setUnsavedChanges(false)
        
        // If it was a new item, remove the 'new' parameter from URL to stop tracking as draft
        if (isNewItem) {
          // Update URL without the 'new' param
          window.history.replaceState({}, '', `/inventory/${id}`)
        }
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/inventory')
        }, 1000)
      } else {
        showSnackbar(data.data || 'Failed to save inventory item', 'error')
      }
    } catch (error) {
      console.error('Error saving inventory item:', error)
      showSnackbar('Network error while saving', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (unsavedChanges) {
      setShowCancelDialog(true)
    } else if (isNewItem) {
      // If it's a new item and no changes were made, still show dialog to confirm deletion
      setShowCancelDialog(true)
    } else {
      navigate('/inventory')
    }
  }

  const handleConfirmCancel = async () => {
    setShowCancelDialog(false)
    
    // If it's a new item, delete it before navigating away
    if (isNewItem) {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          await fetch(`https://tcgid.io/api/v2/inventory/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          })
          // Don't show error/success message, just silently delete
        } catch (error) {
          console.error('Error deleting draft item:', error)
          // Silently fail and navigate away anyway
        }
      }
    }
    
    navigate('/inventory')
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      showSnackbar('Authentication required', 'error')
      setShowDeleteDialog(false)
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`https://tcgid.io/api/v2/inventory/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        showSnackbar('Inventory item deleted successfully', 'success')
        // Navigate back after a short delay
        setTimeout(() => {
          navigate('/inventory')
        }, 1000)
      } else {
        showSnackbar(data.data || 'Failed to delete inventory item', 'error')
        setShowDeleteDialog(false)
      }
    } catch (error) {
      console.error('Error deleting inventory item:', error)
      showSnackbar('Network error while deleting', 'error')
      setShowDeleteDialog(false)
    } finally {
      setDeleting(false)
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

  // Render a single aspect field based on its configuration
  const renderAspectField = (field) => {
    const value = aspectValues[field.aspectName] || (field.cardinality === 'MULTI' ? [] : '')
    const visibleOptions = getVisibleOptions(field, aspectValues)
    
    switch (field.ui.fieldType) {
      case 'select':
        return (
          <FormControl fullWidth size="medium" key={field.aspectName}>
            <InputLabel required={field.required}>{field.aspectName}</InputLabel>
            <Select
              value={value}
              label={field.aspectName}
              onChange={(e) => handleAspectChange(field.aspectName, e.target.value)}
              required={field.required}
              sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {visibleOptions.map(option => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      
      case 'multi-select':
        return (
          <Autocomplete
            key={field.aspectName}
            multiple
            freeSolo={field.mode === 'FREE_TEXT'}
            options={visibleOptions}
            value={Array.isArray(value) ? value : []}
            onChange={(event, newValue) => handleAspectChange(field.aspectName, newValue)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  variant="outlined"
                  label={option}
                  {...getTagProps({ index })}
                  key={option}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={field.aspectName}
                required={field.required}
                size="medium"
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }
                }}
              />
            )}
          />
        )
      
      case 'number':
        return (
          <TextField
            key={field.aspectName}
            label={field.aspectName}
            fullWidth
            type="number"
            value={value}
            onChange={(e) => handleAspectChange(field.aspectName, e.target.value)}
            required={field.required}
            size="medium"
            inputProps={{ 
              step: field.format === 'int32' ? 1 : 'any'
            }}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }
            }}
          />
        )
      
      case 'text':
      default:
        if (field.mode === 'FREE_TEXT' && visibleOptions.length > 0) {
          // Autocomplete with suggestions
          return (
            <Autocomplete
              key={field.aspectName}
              freeSolo
              options={visibleOptions}
              value={value}
              onChange={(event, newValue) => handleAspectChange(field.aspectName, newValue || '')}
              onInputChange={(event, newValue) => {
                if (event && event.type === 'change') {
                  handleAspectChange(field.aspectName, newValue)
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={field.aspectName}
                  required={field.required}
                  size="medium"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }
                  }}
                />
              )}
            />
          )
        } else {
          // Regular text field
          return (
            <TextField
              key={field.aspectName}
              label={field.aspectName}
              fullWidth
              value={value}
              onChange={(e) => handleAspectChange(field.aspectName, e.target.value)}
              required={field.required}
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
          )
        }
    }
  }

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

  const allImages = [...images, ...uploadingImages]
  const currentImageUrl = images[selectedImage] ? getImageUrl(images[selectedImage], '1600') : null

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
        Edit Inventory Item
      </Typography>

      <Paper 
        elevation={3} 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 }, 
          borderRadius: 2,
          maxWidth: { xs: '100%', md: '1000px' },
          mx: 'auto'
        }}
      >
        {/* Image Management Section */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              mb: 2
            }}
          >
            Images {images.length > 0 && `(${images.length}/${MAX_IMAGES})`}
          </Typography>
          
          {/* Large Preview */}
          {currentImageUrl ? (
            <Box
              sx={{
                width: '100%',
                height: { xs: 250, sm: 350, md: 450 },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                mb: 2,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <img
                src={currentImageUrl}
                alt="Preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain'
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="%23ddd" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999" font-size="16">Image Error</text></svg>'
                }}
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                height: { xs: 250, sm: 350, md: 450 },
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: '#f5f5f5',
                borderRadius: 2,
                mb: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography color="text.secondary">No images</Typography>
            </Box>
          )}

          {/* Thumbnails with Drag and Drop */}
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="images" direction="horizontal">
              {(provided) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    display: 'flex',
                    gap: { xs: 0.5, sm: 1 },
                    flexWrap: 'wrap',
                    mb: 2
                  }}
                >
                  {images.map((imageUrl, index) => (
                    <Draggable key={imageUrl} draggableId={imageUrl} index={index}>
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            position: 'relative',
                            width: { xs: 70, sm: 80 },
                            height: { xs: 70, sm: 80 },
                            cursor: 'grab',
                            border: selectedImage === index ? '3px solid' : '1px solid',
                            borderColor: selectedImage === index ? 'primary.main' : 'divider',
                            borderRadius: 1,
                            overflow: 'hidden',
                            opacity: snapshot.isDragging ? 0.5 : 1,
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: 'primary.main'
                            }
                          }}
                          onClick={() => handleImageSelect(index)}
                        >
                          <img
                            src={getImageUrl(imageUrl, '120')}
                            alt={`Thumbnail ${index + 1}`}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="%23ddd" width="80" height="80"/></svg>'
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleImageDelete(index)
                            }}
                            sx={{
                              position: 'absolute',
                              top: 2,
                              right: 2,
                              bgcolor: 'rgba(255, 255, 255, 0.9)',
                              padding: { xs: '2px', sm: '4px' },
                              '&:hover': {
                                bgcolor: 'rgba(255, 255, 255, 1)',
                              }
                            }}
                          >
                            <CloseIcon sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }} />
                          </IconButton>
                        </Box>
                      )}
                    </Draggable>
                  ))}
                  {uploadingImages.map((placeholder) => (
                    <Box
                      key={placeholder.id}
                      sx={{
                        width: { xs: 70, sm: 80 },
                        height: { xs: 70, sm: 80 },
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        bgcolor: '#f5f5f5'
                      }}
                    >
                      {placeholder.uploading ? (
                        <CircularProgress size={24} />
                      ) : placeholder.error ? (
                        <CloseIcon color="error" />
                      ) : null}
                    </Box>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </DragDropContext>

          {/* Upload Button */}
          <Button
            variant="outlined"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={allImages.length >= MAX_IMAGES}
            size="small"
            sx={{
              fontSize: { xs: '0.85rem', sm: '0.875rem' }
            }}
          >
            Upload Images {allImages.length >= MAX_IMAGES && '(Max reached)'}
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
          </Button>
        </Box>

        <Divider sx={{ my: { xs: 3, sm: 4 } }} />

        {/* AI Actions */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              mb: 2
            }}
          >
            AI-Powered Actions
          </Typography>
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
          >
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<AutoAwesomeIcon />}
              onClick={() => showSnackbar('This feature is not currently enabled', 'info')}
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 },
                textTransform: 'none'
              }}
            >
              Match Card with AI
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<PsychologyIcon />}
              onClick={() => showSnackbar('This feature is not currently enabled', 'info')}
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 },
                textTransform: 'none'
              }}
            >
              Assess Condition with AI
            </Button>
          </Stack>
        </Box>

        <Divider sx={{ my: { xs: 3, sm: 4 } }} />

        {/* Form Fields */}
        <Typography 
          variant="h6" 
          gutterBottom
          sx={{
            fontSize: { xs: '1.1rem', sm: '1.25rem' },
            mb: 2
          }}
        >
          Item Details
        </Typography>
        
        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
          <Grid item xs={12}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              inputProps={{ maxLength: 80 }}
              helperText={`${formData.title.length}/80 characters`}
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="medium">
              <InputLabel>Game</InputLabel>
              <Select
                value={formData.game}
                label="Game"
                onChange={(e) => handleFormChange('game', e.target.value)}
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                <MenuItem value="Pokémon TCG">Pokémon TCG</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel 
                component="legend"
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                Graded
              </FormLabel>
              <RadioGroup
                row
                value={formData.graded}
                onChange={(e) => handleFormChange('graded', e.target.value)}
              >
                <FormControlLabel value="Yes" control={<Radio />} label="Yes" />
                <FormControlLabel value="No" control={<Radio />} label="No" />
              </RadioGroup>
            </FormControl>
          </Grid>

          {formData.graded === 'Yes' && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Professional Grader"
                  fullWidth
                  value={formData.professional_grader}
                  onChange={(e) => handleFormChange('professional_grader', e.target.value)}
                  size="medium"
                  sx={{
                    '& .MuiInputBase-root': {
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={formData.grade}
                    label="Grade"
                    onChange={(e) => handleFormChange('grade', e.target.value)}
                    sx={{
                      fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(grade => (
                      <MenuItem key={grade} value={grade.toString()}>{grade}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}

          {formData.graded === 'No' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="medium">
                <InputLabel>Condition</InputLabel>
                <Select
                  value={formData.condition}
                  label="Condition"
                  onChange={(e) => handleFormChange('condition', e.target.value)}
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  <MenuItem value="Near Mint">Near Mint</MenuItem>
                  <MenuItem value="Lightly Played">Lightly Played</MenuItem>
                  <MenuItem value="Moderately Played">Moderately Played</MenuItem>
                  <MenuItem value="Heavily Played">Heavily Played</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <TextField
              label="Card Name"
              fullWidth
              value={formData.card_name}
              onChange={(e) => handleFormChange('card_name', e.target.value)}
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Character"
              fullWidth
              value={formData.character}
              onChange={(e) => handleFormChange('character', e.target.value)}
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="medium">
              <InputLabel>Card Type</InputLabel>
              <Select
                value={formData.card_type}
                label="Card Type"
                onChange={(e) => handleFormChange('card_type', e.target.value)}
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                <MenuItem value="Pokémon">Pokémon</MenuItem>
                <MenuItem value="Trainer">Trainer</MenuItem>
                <MenuItem value="Item">Item</MenuItem>
                <MenuItem value="Stadium">Stadium</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {formData.card_type === 'Pokémon' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="medium">
                <InputLabel>Stage</InputLabel>
                <Select
                  value={formData.stage}
                  label="Stage"
                  onChange={(e) => handleFormChange('stage', e.target.value)}
                  sx={{
                    fontSize: { xs: '0.9rem', sm: '1rem' }
                  }}
                >
                  <MenuItem value="Basic">Basic</MenuItem>
                  <MenuItem value="Stage 1">Stage 1</MenuItem>
                  <MenuItem value="Stage 2">Stage 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="medium">
              <InputLabel>Language</InputLabel>
              <Select
                value={formData.language}
                label="Language"
                onChange={(e) => handleFormChange('language', e.target.value)}
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                <MenuItem value="English">English</MenuItem>
                <MenuItem value="Japanese">Japanese</MenuItem>
                <MenuItem value="Chinese">Chinese</MenuItem>
                <MenuItem value="Korean">Korean</MenuItem>
                <MenuItem value="German">German</MenuItem>
                <MenuItem value="Italian">Italian</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="medium">
              <InputLabel>Finish</InputLabel>
              <Select
                value={formData.finish}
                label="Finish"
                onChange={(e) => handleFormChange('finish', e.target.value)}
                sx={{
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }}
              >
                <MenuItem value="Regular">Regular</MenuItem>
                <MenuItem value="Holo">Holo</MenuItem>
                <MenuItem value="Reverse Holo">Reverse Holo</MenuItem>
                <MenuItem value="Foil">Foil</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={4}
              value={formData.description}
              onChange={(e) => handleFormChange('description', e.target.value)}
              size="medium"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.9rem', sm: '1rem' }
                }
              }}
            />
          </Grid>
        </Grid>

        {/* eBay Aspects Section */}
        <Divider sx={{ my: { xs: 3, sm: 4 } }} />
        
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{
              fontSize: { xs: '1.1rem', sm: '1.25rem' },
              mb: 2
            }}
          >
            eBay Product Aspects
          </Typography>
          
          {aspectsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : aspectsError ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Failed to load eBay aspects: {aspectsError}
            </Alert>
          ) : aspects && aspectFields.length > 0 ? (
            <>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mb: 3, fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
              >
                These fields are specific to eBay listings and help improve discoverability. 
                Fields marked with * are required by eBay.
              </Typography>
              
              {Object.keys(groupedAspectFields).map(groupName => (
                <Box key={groupName} sx={{ mb: 3 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 600,
                      fontSize: { xs: '0.95rem', sm: '1rem' }
                    }}
                  >
                    {groupName}
                  </Typography>
                  <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                    {groupedAspectFields[groupName]
                      .filter(field => !field.ui.hidden)
                      .map(field => (
                        <Grid item xs={12} sm={6} key={field.aspectName}>
                          {renderAspectField(field)}
                        </Grid>
                      ))}
                  </Grid>
                </Box>
              ))}
            </>
          ) : null}
        </Box>

        {/* Action Buttons */}
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2}
          sx={{ 
            mt: { xs: 3, sm: 4 }, 
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
          <Button
            variant="outlined"
            color="error"
            onClick={handleDeleteClick}
            disabled={saving || deleting}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              minWidth: { sm: '120px' },
              fontSize: { xs: '0.9rem', sm: '1rem' },
              py: { xs: 1, sm: 1.5 }
            }}
          >
            Delete Item
          </Button>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            <Button
              variant="outlined"
              onClick={handleCancel}
              disabled={saving || deleting}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { sm: '120px' },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || deleting || uploadingImages.length > 0}
              sx={{
                width: { xs: '100%', sm: 'auto' },
                minWidth: { sm: '120px' },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 }
              }}
            >
              {saving ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          {isNewItem ? 'Delete Draft Item?' : 'Discard Changes?'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            {isNewItem 
              ? 'This item has not been saved. Do you want to delete this draft and return to the inventory list?'
              : 'You have unsaved changes. Are you sure you want to discard them?'
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button 
            onClick={() => setShowCancelDialog(false)}
            sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
          >
            Continue Editing
          </Button>
          <Button 
            onClick={handleConfirmCancel} 
            color="error" 
            autoFocus
            sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
          >
            {isNewItem ? 'Delete Draft' : 'Discard Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => !deleting && setShowDeleteDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Delete Inventory Item?
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>
            Are you sure you want to permanently delete this inventory item? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button 
            onClick={() => setShowDeleteDialog(false)}
            disabled={deleting}
            sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={deleting}
            autoFocus
            sx={{ fontSize: { xs: '0.85rem', sm: '0.875rem' } }}
          >
            {deleting ? <CircularProgress size={20} color="inherit" /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
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
