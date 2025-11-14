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
import DescriptionIcon from '@mui/icons-material/Description'
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
import Accordion from '@mui/material/Accordion'
import AccordionSummary from '@mui/material/AccordionSummary'
import AccordionDetails from '@mui/material/AccordionDetails'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
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
  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true, // Basic Info expanded by default
    // Other subsections will be added dynamically based on groupedAspectFields
  })
  
  // Inventory data
  const [originalData, setOriginalData] = useState(null)
  const [inventoryData, setInventoryData] = useState(null)
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
    certification_number: '',
    condition: '',
    card_name: '',
    character: '',
    card_type: '',
    language: '',
    finish: '',
    stage: '',
    description: ''
  })
  
  // Aspect values state
  const [aspectValues, setAspectValues] = useState({})
  
  // Always fetch aspects for category 183454
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

  // Set default values for autographed when aspects load (if not already set)
  useEffect(() => {
    if (!aspects || !aspects.aspects) return
    
    setAspectValues(prev => {
      // Only set default if autographed is not already set
      if (!prev['Autographed'] && !prev['autographed']) {
        return { ...prev, 'Autographed': 'No' }
      }
      return prev
    })
  }, [aspects])

  // Map aspect values from inventory_data when both are loaded
  useEffect(() => {
    if (!inventoryData || !aspects || !aspects.aspects) return

    // Compute aspect fields inside the effect to avoid dependency issues
    const fields = mapEbayAspectsToFields(aspects.aspects)
    if (!fields.length) return

    // List of form fields that should not be treated as aspect values
    const formFieldKeys = [
      'title', 'game', 'graded', 'professional_grader', 'grade', 
      'certification_number', 'condition', 'card_name', 'character', 
      'card_type', 'language', 'finish', 'stage', 'description'
    ]

    const mappedAspectValues = {}
    
    // Extract aspect values from inventory_data
    fields.forEach(field => {
      const aspectName = field.aspectName
      const value = inventoryData[aspectName]
      
      // Skip if value doesn't exist or is in form fields
      if (value === undefined || value === null || value === '' || formFieldKeys.includes(aspectName)) {
        return
      }

      // Handle multi-select fields (arrays stored as comma-separated strings)
      if (field.cardinality === 'MULTI') {
        if (typeof value === 'string' && value.includes(',')) {
          // Split comma-separated string back into array
          mappedAspectValues[aspectName] = value.split(',').map(v => v.trim()).filter(v => v)
        } else if (Array.isArray(value)) {
          // Already an array
          mappedAspectValues[aspectName] = value
        } else if (value) {
          // Single value, wrap in array
          mappedAspectValues[aspectName] = [String(value)]
        }
      } else {
        // Single value field
        mappedAspectValues[aspectName] = String(value)
      }
    })

    // Normalize autographed key (use 'Autographed' consistently)
    if (mappedAspectValues['autographed']) {
      mappedAspectValues['Autographed'] = mappedAspectValues['autographed']
      delete mappedAspectValues['autographed']
    }
    
    // Set autographed from inventory data if not already mapped
    if (!mappedAspectValues['Autographed']) {
      const autographedValue = inventoryData['Autographed'] || inventoryData['autographed']
      if (autographedValue) {
        mappedAspectValues['Autographed'] = String(autographedValue)
      }
    }

    // Only update if we found aspect values or need to set defaults
    setAspectValues(prev => ({ ...prev, ...mappedAspectValues }))
  }, [inventoryData, aspects])

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
        const inventoryDataObj = item.inventory_data || {}
        setInventoryData(inventoryDataObj)
        setFormData({
          title: inventoryDataObj.title || '',
          game: inventoryDataObj.game || 'Pokémon TCG',
          graded: inventoryDataObj.graded || 'No',
          professional_grader: inventoryDataObj.professional_grader || '',
          grade: inventoryDataObj.grade || '',
          certification_number: inventoryDataObj.certification_number || '',
          condition: inventoryDataObj.condition || '',
          card_name: inventoryDataObj.card_name || '',
          character: inventoryDataObj.character || '',
          card_type: inventoryDataObj.card_type || '',
          language: inventoryDataObj.language || '',
          finish: inventoryDataObj.finish || '',
          stage: inventoryDataObj.stage || '',
          description: inventoryDataObj.description || ''
        })
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
        // Hide graded fields, show condition field
        setFormData(prev => ({
          ...prev,
          graded: value,
          professional_grader: '',
          grade: '',
          certification_number: ''
        }))
      } else {
        // Hide condition field, show graded fields
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
    setAspectValues(prev => {
      const newValues = { ...prev, [aspectName]: value }
      
      // Clear dependent fields when changing graded status
      if (aspectName === 'Graded' || aspectName === 'graded') {
        if (value === 'No' || value === 'no') {
          // Clear graded-related fields when hiding them
          delete newValues['Professional Grader']
          delete newValues['professional_grader']
          delete newValues['Grade']
          delete newValues['grade']
          delete newValues['Certification Number']
          delete newValues['certification_number']
          // Also clear formData fields
          setFormData(prevForm => ({
            ...prevForm,
            graded: String(value),
            professional_grader: '',
            grade: '',
            certification_number: ''
          }))
        } else {
          // Clear condition field when showing graded fields
          delete newValues['Card Condition']
          delete newValues['card_condition']
          delete newValues['Condition']
          delete newValues['condition']
          // Also clear formData condition field
          setFormData(prevForm => ({
            ...prevForm,
            graded: String(value),
            condition: ''
          }))
        }
      }
      
      // Clear dependent fields when changing autographed status
      if (aspectName === 'Autographed' || aspectName === 'autographed') {
        if (value === 'No' || value === 'no') {
          // Clear autograph fields when hiding them
          delete newValues['Autograph Authentication']
          delete newValues['autograph_authentication']
          delete newValues['Autograph Authentication Number']
          delete newValues['autograph_authentication_number']
          delete newValues['Autograph Format']
          delete newValues['autograph_format']
        }
      }
      
      return newValues
    })
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

    // Validate aspect values
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

      // Merge aspect values into data object (convert arrays to strings if needed)
      Object.keys(aspectValues).forEach(key => {
        const value = aspectValues[key]
        // Skip empty values
        if (value === '' || value === null || value === undefined) {
          return
        }
        // Handle array values (multi-select fields)
        if (Array.isArray(value)) {
          // Only include non-empty arrays
          if (value.length > 0) {
            dataToSave[key] = value.join(', ')
          }
        } else {
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

  const handleAccordionChange = (section) => (event, isExpanded) => {
    setExpandedSections(prev => ({ ...prev, [section]: isExpanded }))
  }

  const isSectionExpanded = (section) => {
    return expandedSections[section] ?? false
  }

  // Determine if a field should be visible based on graded/autographed status
  const isFieldVisible = (fieldName) => {
    const fieldNameLower = fieldName.toLowerCase().trim()
    
    // Get graded value (could be in formData or aspectValues)
    const gradedValue = formData.graded || aspectValues['Graded'] || aspectValues['graded'] || 'No'
    const gradedIsNo = gradedValue === 'No' || gradedValue === 'no' || gradedValue === ''
    
    // Get autographed value (likely in aspectValues)
    const autographedValue = aspectValues['Autographed'] || aspectValues['autographed'] || 'No'
    const autographedIsNo = autographedValue === 'No' || autographedValue === 'no' || autographedValue === ''
    
    // Fields to hide when graded is "No" - check for exact matches and partial matches
    const gradedFields = [
      'professional grader', 'professional_grader', 'professionalgrader',
      'grade',
      'certification number', 'certification_number', 'certificationnumber'
    ]
    
    // Fields to hide when graded is "Yes" - check for exact matches and partial matches
    const conditionFields = [
      'card condition', 'card_condition', 'cardcondition',
      'condition'
    ]
    
    // Fields to hide when autographed is "No"
    const autographFields = [
      'autograph authentication', 'autograph_authentication', 'autographauthentication',
      'autograph authentication number', 'autograph_authentication_number', 'autographauthenticationnumber',
      'autograph format', 'autograph_format', 'autographformat'
    ]
    
    // Always show "Graded" and "Autographed" fields themselves
    if (fieldNameLower === 'graded' || fieldNameLower === 'autographed') {
      return true
    }
    
    // Check graded-related visibility
    if (gradedIsNo) {
      // Hide graded fields when graded is "No"
      if (gradedFields.some(f => {
        const fLower = f.toLowerCase()
        return fieldNameLower === fLower || fieldNameLower.includes(fLower) || fLower.includes(fieldNameLower)
      })) {
        return false
      }
    } else {
      // Hide condition field when graded is "Yes"
      if (conditionFields.some(f => {
        const fLower = f.toLowerCase()
        return fieldNameLower === fLower || fieldNameLower.includes(fLower) || fLower.includes(fieldNameLower)
      })) {
        return false
      }
    }
    
    // Check autographed-related visibility
    if (autographedIsNo) {
      // Hide autograph fields when autographed is "No"
      if (autographFields.some(f => {
        const fLower = f.toLowerCase()
        return fieldNameLower === fLower || fieldNameLower.includes(fLower) || fLower.includes(fieldNameLower)
      })) {
        return false
      }
    }
    
    return true
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
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<DescriptionIcon />}
              onClick={() => showSnackbar('This feature is not currently enabled', 'info')}
              sx={{
                fontSize: { xs: '0.9rem', sm: '1rem' },
                py: { xs: 1, sm: 1.5 },
                textTransform: 'none'
              }}
            >
              Draft Item Description with AI
            </Button>
          </Stack>
        </Box>

        {/* Item Details Section */}
        <Box sx={{ mb: { xs: 3, sm: 4 } }}>
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
          
          {/* Basic Info - Title and Description */}
          <Accordion 
            expanded={isSectionExpanded('basicInfo')} 
            onChange={handleAccordionChange('basicInfo')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '0.95rem', sm: '1rem' }
                }}
              >
                Title and Description
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
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
            </AccordionDetails>
          </Accordion>
              
          {/* Aspect Fields */}
          {aspectsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={32} />
            </Box>
          ) : aspectsError ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Failed to load item details: {aspectsError}
            </Alert>
          ) : aspects && aspectFields.length > 0 ? (
            <>
              {Object.keys(groupedAspectFields).map(groupName => (
                <Accordion 
                  key={groupName}
                  expanded={isSectionExpanded(groupName)} 
                  onChange={handleAccordionChange(groupName)}
                  sx={{ mb: 2 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '0.95rem', sm: '1rem' }
                      }}
                    >
                      {groupName}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                      {groupedAspectFields[groupName]
                        .filter(field => !field.ui.hidden && isFieldVisible(field.aspectName))
                        .map(field => (
                          <Grid item xs={12} sm={6} key={field.aspectName}>
                            {renderAspectField(field)}
                          </Grid>
                        ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
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
