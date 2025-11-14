import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import Stack from '@mui/material/Stack'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import CircularProgress from '@mui/material/CircularProgress'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteIcon from '@mui/icons-material/Delete'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { styled } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'
import Grid from '@mui/material/Grid'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

const UploadArea = styled(Box)(({ theme, isDragOver }) => ({
  border: `2px dashed ${isDragOver ? theme.palette.primary.main : theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(4),
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragOver ? theme.palette.action.hover : 'transparent',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}))

const ImageItem = styled(Paper)(({ theme, isDragging, isDragOver }) => ({
  position: 'relative',
  padding: theme.spacing(1),
  cursor: isDragging ? 'grabbing' : 'grab',
  opacity: isDragging ? 0.5 : 1,
  transition: 'all 0.2s ease-in-out',
  border: isDragOver ? `2px solid ${theme.palette.primary.main}` : 'none',
  boxShadow: isDragOver ? theme.shadows[6] : theme.shadows[2],
  '&:hover': {
    boxShadow: theme.shadows[4],
  },
}))

const ImagePreview = styled('img')({
  width: '100%',
  height: '150px',
  objectFit: 'cover',
  borderRadius: 4,
  display: 'block',
})

export default function CreateInventory() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [photosPerListing, setPhotosPerListing] = useState('1')
  const [isDragOver, setIsDragOver] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [snackbarSeverity, setSnackbarSeverity] = useState('success')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [progressModalOpen, setProgressModalOpen] = useState(false)
  const [progressMessage, setProgressMessage] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [totalImages, setTotalImages] = useState(0)

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/signin')
    }
  }, [navigate])

  const validateImageFile = (file) => {
    if (!file) return false
    return file.type.startsWith('image/')
  }

  const handleFileSelect = (files) => {
    if (!files || files.length === 0) return

    const imageFiles = Array.from(files).filter(validateImageFile)
    
    if (imageFiles.length !== files.length) {
      showSnackbar('Some files were not image files and were skipped', 'warning')
    }

    if (imageFiles.length === 0) {
      showSnackbar('Please select valid image files', 'error')
      return
    }

    // Create file objects with preview URLs
    const newFiles = imageFiles.map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      preview: URL.createObjectURL(file),
    }))

    setSelectedFiles((prev) => [...prev, ...newFiles])
  }

  const handleFileInputChange = (event) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
    // Reset input to allow selecting the same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDragOver = (event) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleRemoveFile = (id) => {
    setSelectedFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const handleRemoveAll = () => {
    selectedFiles.forEach((fileObj) => {
      URL.revokeObjectURL(fileObj.preview)
    })
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Drag and drop for reordering
  const handleDragStart = (index) => {
    setDraggedIndex(index)
    setDragOverIndex(null)
  }

  const handleDragOverItem = (event, index) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null)
      return
    }
    setDragOverIndex(index)
  }

  const handleDragLeaveItem = () => {
    setDragOverIndex(null)
  }

  const handleDropItem = (event, dropIndex) => {
    event.preventDefault()
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    setSelectedFiles((prev) => {
      const newFiles = [...prev]
      const draggedItem = newFiles[draggedIndex]
      newFiles.splice(draggedIndex, 1)
      newFiles.splice(dropIndex, 0, draggedItem)
      return newFiles
    })
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleSubmit = async () => {
    // Validate form
    if (selectedFiles.length === 0) {
      showSnackbar('Please select at least one image file to upload', 'error')
      return
    }

    // Validate that the number of photos is evenly divisible by photos per listing
    const photosPerListingNum = parseInt(photosPerListing, 10)
    if (selectedFiles.length % photosPerListingNum !== 0) {
      showSnackbar(
        `The number of photos (${selectedFiles.length}) must be evenly divisible by the photos per listing (${photosPerListingNum}). Please adjust your selection.`,
        'error'
      )
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      showSnackbar('Authentication required. Please sign in again.', 'error')
      navigate('/signin')
      return
    }

    setIsSubmitting(true)
    
    // Step 1: Group photos based on photos per listing
    const groups = []
    for (let i = 0; i < selectedFiles.length; i += photosPerListingNum) {
      groups.push(selectedFiles.slice(i, i + photosPerListingNum))
    }

    // Initialize progress tracking
    setTotalImages(selectedFiles.length)
    setUploadedCount(0)
    setProgressModalOpen(true)
    setProgressMessage(`Creating ${groups.length} Inventory Item${groups.length !== 1 ? 's' : ''}...`)

    try {
      // Step 2: Prepare batch request body with filenames
      const batchRequestBody = {}
      groups.forEach((group, index) => {
        const groupNumber = String(index + 1)
        batchRequestBody[groupNumber] = group.map(fileObj => fileObj.file.name)
      })

      // Step 3: Call batch endpoint to create inventory items and get presigned URLs
      const batchResponse = await fetch(
        `https://tcgid.io/api/v2/inventory/batch?count=${groups.length}&photos=${photosPerListingNum}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(batchRequestBody),
        }
      )

      const batchData = await batchResponse.json()

      if (!batchResponse.ok || !batchData.success) {
        setProgressModalOpen(false)
        throw new Error(batchData.data || 'Failed to create batch inventory items')
      }

      const batchResults = batchData.data
      
      // Update progress message to show uploading
      const totalImageCount = selectedFiles.length
      setProgressMessage(`Uploading 0/${totalImageCount} images...`)

      // Step 4: Upload all images concurrently across all groups
      // Build a map of all upload tasks: filename -> { presignedUrl, file, groupIndex, inventoryId }
      const uploadTasks = []
      const filenameToUploadInfo = {} // Track filename -> upload info for ordering later
      
      groups.forEach((group, groupIndex) => {
        const groupNumber = String(groupIndex + 1)
        const groupData = batchResults[groupNumber]
        
        if (!groupData || !groupData.id) {
          console.error(`Group ${groupNumber} missing from batch response`)
          return
        }
        
        const inventoryId = groupData.id
        const imageUrls = groupData.image_urls || {}
        
        group.forEach((fileObj) => {
          const filename = fileObj.file.name
          const presignedUrl = imageUrls[filename]
          
          if (presignedUrl) {
            // Extract upload_uuid from presigned URL
            // Pattern: https://bucket.s3.amazonaws.com/{user_id}/{inventory_id}/{upload_uuid}/{filename}?...
            // Example: https://user-uploads-tcgid-io.s3.amazonaws.com/7ecafeb2-.../44074fa4-.../d96b13b4-.../example1.jpg?...
            const urlParts = presignedUrl.split('/')
            const inventoryIndex = urlParts.findIndex(part => part === inventoryId)
            let uploadUuid = null
            
            if (inventoryIndex >= 0 && inventoryIndex + 1 < urlParts.length) {
              // The upload_uuid is the part right after inventory_id
              uploadUuid = urlParts[inventoryIndex + 1].split('?')[0] // Remove query params if any
            }
            
            // Fallback: try regex match for UUID pattern
            if (!uploadUuid) {
              const uuidMatch = presignedUrl.match(/\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\/[^\/]+\.(jpg|jpeg|png|gif|bmp|webp|svg)/i)
              if (uuidMatch) {
                // Find which UUID is the upload_uuid (should be after inventory_id)
                const allUuids = presignedUrl.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi)
                if (allUuids && allUuids.length >= 3) {
                  // user_id, inventory_id, upload_uuid
                  uploadUuid = allUuids[2]
                }
              }
            }
            
            const finalUploadUuid = uploadUuid
            
            uploadTasks.push({
              filename,
              presignedUrl,
              file: fileObj.file,
              groupIndex,
              inventoryId,
              uploadUuid: finalUploadUuid,
            })
            
            filenameToUploadInfo[filename] = {
              groupIndex,
              inventoryId,
              uploadUuid: finalUploadUuid,
            }
          }
        })
      })

      // Upload all images concurrently
      const uploadPromises = uploadTasks.map(async (task) => {
        const contentType = task.file.type || 'image/jpeg'
        
        const uploadResponse = await fetch(task.presignedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
          },
          body: task.file,
        })

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text().catch(() => 'Unknown error')
          throw new Error(`Failed to upload ${task.filename}: ${uploadResponse.status} ${errorText}`)
        }

        if (uploadResponse.status !== 200) {
          throw new Error(`Unexpected S3 upload status for ${task.filename}: ${uploadResponse.status}`)
        }

        // Update progress counter
        setUploadedCount(prev => {
          const newCount = prev + 1
          setProgressMessage(`Uploading ${newCount}/${totalImageCount} images...`)
          return newCount
        })

        console.log(`Successfully uploaded image: ${task.filename}`)
        return task
      })

      // Wait for all uploads to complete
      const uploadResults = await Promise.allSettled(uploadPromises)
      
      // Check for upload failures
      const failedUploads = uploadResults.filter(result => result.status === 'rejected')
      if (failedUploads.length > 0) {
        console.error('Some uploads failed:', failedUploads)
        // Continue processing - we'll handle failures per group
      }

      // Step 5: Process all groups in parallel - poll and reorder images
      const processGroup = async (group, groupIndex) => {
        const groupNumber = String(groupIndex + 1)
        const groupData = batchResults[groupNumber]
        let inventoryId = null

        if (!groupData || !groupData.id) {
          console.error(`Group ${groupNumber} missing from batch response`)
          return { success: false, groupIndex: groupIndex + 1 }
        }

        inventoryId = groupData.id

        try {

          // Step 6: Poll for processed images until images array is populated
          const pollForProcessedImages = async () => {
            const startTime = Date.now()
            const timeout = 30000 // 30 seconds timeout
            const pollInterval = 1500 // Poll every 1.5 seconds

            const poll = async () => {
              try {
                const response = await fetch(
                  `https://tcgid.io/api/v2/inventory/${inventoryId}`,
                  {
                    method: 'GET',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  }
                )

                const data = await response.json()

                if (response.ok && data.success) {
                  const currentImages = data.data.images || []
                  
                  // Check if we have the expected number of images
                  if (currentImages.length !== group.length) {
                    // Not all images processed yet, continue polling
                    if (Date.now() - startTime > timeout) {
                      console.warn(`Timeout: Only ${currentImages.length} of ${group.length} images processed (group ${groupNumber})`)
                      return null
                    }
                    await new Promise(resolve => setTimeout(resolve, pollInterval))
                    return poll()
                  }

                  // All images are present, return both images and full data (for user_id)
                  return { images: currentImages, inventoryData: data.data }
                }

                // Check timeout
                if (Date.now() - startTime > timeout) {
                  console.warn(`Timeout waiting for processed images (group ${groupNumber})`)
                  return null
                }

                // Continue polling
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                return poll()
              } catch (error) {
                console.error(`Error polling for processed images (group ${groupNumber}):`, error)
                if (Date.now() - startTime > timeout) {
                  return null
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval))
                return poll()
              }
            }

            return poll()
          }

          // Poll for processed images
          const pollResult = await pollForProcessedImages()

          if (!pollResult || !pollResult.images || pollResult.images.length !== group.length) {
            throw new Error(`Failed to get all processed images: ${pollResult?.images?.length || 0} of ${group.length}`)
          }

          const processedImages = pollResult.images
          const userId = pollResult.inventoryData?.user_id

          // Step 7: Reorder images based on original file order

          // Extract upload_uuid from each processed image URL and match to original order
          const orderedImages = []
          
          for (const fileObj of group) {
            const filename = fileObj.file.name
            const uploadInfo = filenameToUploadInfo[filename]
            
            if (!uploadInfo || !uploadInfo.uploadUuid) {
              console.warn(`Could not find upload info for ${filename}`)
              // Try to construct URL if we have user_id
              if (userId) {
                const constructedUrl = `https://tcgid.io/images/${userId}/${inventoryId}/${uploadInfo?.uploadUuid || 'unknown'}/master.png`
                orderedImages.push(constructedUrl)
              }
              continue
            }

            // Find the processed image URL that contains this upload_uuid
            const matchingImage = processedImages.find(img => 
              img && img.includes(`/${uploadInfo.uploadUuid}/`)
            )

            if (matchingImage) {
              orderedImages.push(matchingImage)
            } else {
              // Fallback: construct the URL using the pattern
              if (userId) {
                const constructedUrl = `https://tcgid.io/images/${userId}/${inventoryId}/${uploadInfo.uploadUuid}/master.png`
                orderedImages.push(constructedUrl)
                console.log(`Constructed URL for ${filename}: ${constructedUrl}`)
              } else {
                console.warn(`Could not construct URL for ${filename}: missing user_id`)
              }
            }
          }

          // Verify we have all images in the correct order
          if (orderedImages.length !== group.length) {
            throw new Error(`Could not order all images: ${orderedImages.length} of ${group.length}`)
          }

          // Step 8: Update inventory with correctly ordered images
          const updateResponse = await fetch(
            `https://tcgid.io/api/v2/inventory/${inventoryId}`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                images: orderedImages,
              }),
            }
          )

          const updateData = await updateResponse.json()

          if (!updateResponse.ok || !updateData.success) {
            throw new Error(updateData.data || 'Failed to update inventory with ordered images')
          }

          // Final verification: Get the inventory item one more time
          const verifyResponse = await fetch(
            `https://tcgid.io/api/v2/inventory/${inventoryId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          )

          const verifyData = await verifyResponse.json()

          if (verifyResponse.ok && verifyData.success) {
            const finalImages = verifyData.data.images || []
            
            // Verify we have the expected number of images
            if (finalImages.length !== group.length) {
              console.error(`Final verification: Expected ${group.length} images but got ${finalImages.length} (group ${groupNumber})`)
              // Deactivate if we don't have all images
              if (inventoryId) {
                try {
                  await fetch(`https://tcgid.io/api/v2/inventory/${inventoryId}`, {
                    method: 'DELETE',
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  })
                } catch (deleteError) {
                  console.error('Error deactivating inventory item:', deleteError)
                }
              }
              throw new Error(`Final verification failed: Only ${finalImages.length} of ${group.length} images are present`)
            }

            // Check for images that might be errors (empty or invalid URLs)
            const validImages = finalImages.filter(img => 
              img && img.trim() !== '' && !img.includes('error') && !img.includes('undefined')
            )

            if (validImages.length !== group.length) {
              console.warn(`Warning: ${finalImages.length - validImages.length} images may be invalid (group ${groupNumber})`)
              // If we have fewer valid images than expected, deactivate
              if (validImages.length < group.length) {
                if (inventoryId) {
                  try {
                    await fetch(`https://tcgid.io/api/v2/inventory/${inventoryId}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                      },
                    })
                  } catch (deleteError) {
                    console.error('Error deactivating inventory item:', deleteError)
                  }
                }
                throw new Error(`Invalid images detected: Only ${validImages.length} valid images out of ${group.length}`)
              }
            }
          } else {
            console.error(`Failed to verify inventory item (group ${groupNumber}):`, verifyData)
            throw new Error('Failed to verify inventory item')
          }

          return { success: true, groupIndex: groupIndex + 1 }
        } catch (error) {
          console.error(`Error processing group ${groupIndex + 1}:`, error)
          // Deactivate inventory item if it was created
          if (inventoryId) {
            try {
              await fetch(`https://tcgid.io/api/v2/inventory/${inventoryId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              })
            } catch (deleteError) {
              console.error('Error deactivating inventory item:', deleteError)
            }
          }
          return { success: false, groupIndex: groupIndex + 1 }
        }
      }

      // Update progress message to show verification
      setProgressMessage('Verifying inventory creation...')

      // Process all groups in parallel
      const groupPromises = groups.map((group, index) => processGroup(group, index))
      const results = await Promise.allSettled(groupPromises)

      // Count successes and failures
      let successCount = 0
      const failedGroups = []

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++
        } else {
          const groupIndex = result.status === 'fulfilled' 
            ? result.value.groupIndex 
            : index + 1
          failedGroups.push(groupIndex)
        }
      })

      // Close progress modal
      setProgressModalOpen(false)

      // Show results
      if (successCount > 0) {
        // Show success message (green toast)
        showSnackbar(`${successCount} Inventory Item${successCount !== 1 ? 's' : ''} created`, 'success')
        
        // If there were failures, show error message after success message
        if (failedGroups.length > 0) {
          // Wait for success message to be visible, then show error
          setTimeout(() => {
            showSnackbar(
              `Groups ${failedGroups.join(', ')} failed to upload and were deactivated.`,
              'error'
            )
          }, 3000)
        }
        
        // Redirect to inventory page after showing messages
        setTimeout(() => {
          navigate('/inventory')
        }, failedGroups.length > 0 ? 6000 : 2000)
      } else {
        // No successes - show error message
        if (failedGroups.length > 0) {
          showSnackbar(
            `Failed to create inventory items. Groups ${failedGroups.join(', ')} could not be processed.`,
            'error'
          )
        } else {
          showSnackbar('Failed to create inventory items. Please try again.', 'error')
        }
      }
    } catch (error) {
      console.error('Error creating inventory:', error)
      setProgressModalOpen(false)
      showSnackbar('An error occurred while creating inventory. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    selectedFiles.forEach((fileObj) => {
      URL.revokeObjectURL(fileObj.preview)
    })
    setSelectedFiles([])
    setPhotosPerListing('1')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((fileObj) => {
        URL.revokeObjectURL(fileObj.preview)
      })
    }
  }, [])

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message)
    setSnackbarSeverity(severity)
    setSnackbarOpen(true)
  }

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <Box sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      <Typography 
        variant="h4" 
        gutterBottom
        sx={{ 
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
        }}
      >
        Create Inventory
      </Typography>

      <Paper 
        elevation={2} 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          maxWidth: { xs: '100%', sm: '800px', md: '900px' },
          mx: 'auto'
        }}
      >
        {/* Instructions */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" component="div">
            <strong>How to create inventory:</strong>
            <Box component="ol" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>Select or drag and drop image files from your device</li>
              <li>Reorder images by dragging them to change the order (optional)</li>
              <li>Select how many photos should be grouped per listing</li>
              <li>Click "Create Inventory" to process your upload</li>
            </Box>
            <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
              The system will automatically group photos according to your settings 
              and initialize eBay listings for each group.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 500 }}>
              <strong>Important:</strong> The total uncompressed file size must be under 2GB to be processed.
            </Typography>
          </Typography>
        </Alert>

        <Stack spacing={3}>
          {/* File Upload Section */}
          <Box>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              Upload Image Files
            </Typography>
            {selectedFiles.length === 0 ? (
              <UploadArea
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                isDragOver={isDragOver}
              >
                <CloudUploadIcon 
                  sx={{ 
                    fontSize: { xs: 48, sm: 64, md: 80 },
                    color: 'text.secondary',
                    mb: 2
                  }} 
                />
                <Typography variant="body1" gutterBottom>
                  Drag and drop image files here, or click to browse
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Only image files are accepted (JPG, PNG, GIF, etc.)
                </Typography>
                <VisuallyHiddenInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                />
              </UploadArea>
            ) : (
              <Box>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    size="small"
                  >
                    Add More Images
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleRemoveAll}
                    size="small"
                  >
                    Remove All
                  </Button>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                    {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
                  </Typography>
                </Stack>
                <VisuallyHiddenInput
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileInputChange}
                />
                <Box
                  sx={{
                    maxHeight: { xs: '400px', sm: '500px', md: '600px' },
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    pr: 1,
                    '&::-webkit-scrollbar': {
                      width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                      backgroundColor: 'rgba(0, 0, 0, 0.05)',
                      borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      backgroundColor: 'rgba(0, 0, 0, 0.2)',
                      borderRadius: '4px',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      },
                    },
                  }}
                >
                  <Grid container spacing={2}>
                    {selectedFiles.map((fileObj, index) => (
                      <Grid item xs={6} sm={4} md={3} key={fileObj.id}>
                        <ImageItem
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOverItem(e, index)}
                          onDragLeave={handleDragLeaveItem}
                          onDrop={(e) => handleDropItem(e, index)}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedIndex === index}
                          isDragOver={dragOverIndex === index}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <ImagePreview
                              src={fileObj.preview}
                              alt={fileObj.file.name}
                              onError={(e) => {
                                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect fill="%23ddd" width="150" height="150"/></svg>'
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                left: 4,
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {index + 1}
                            </Box>
                            <IconButton
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                },
                              }}
                              onClick={() => handleRemoveFile(fileObj.id)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" noWrap sx={{ display: 'block' }}>
                              {fileObj.file.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatFileSize(fileObj.file.size)}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mt: 0.5,
                              color: 'text.secondary',
                            }}
                          >
                            <DragIndicatorIcon fontSize="small" />
                            <Typography variant="caption" sx={{ ml: 0.5 }}>
                              Drag to reorder
                            </Typography>
                          </Box>
                        </ImageItem>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </Box>
            )}
          </Box>

          {/* Photos Per Listing Dropdown */}
          <FormControl fullWidth>
            <InputLabel>Photos Per Listing</InputLabel>
            <Select
              value={photosPerListing}
              label="Photos Per Listing"
              onChange={(e) => setPhotosPerListing(e.target.value)}
            >
              <MenuItem value="1">1 photo</MenuItem>
              <MenuItem value="2">2 photos</MenuItem>
              <MenuItem value="3">3 photos</MenuItem>
              <MenuItem value="4">4 photos</MenuItem>
              <MenuItem value="5">5 photos</MenuItem>
              <MenuItem value="6">6 photos</MenuItem>
              <MenuItem value="7">7 photos</MenuItem>
              <MenuItem value="8">8 photos</MenuItem>
              <MenuItem value="9">9 photos</MenuItem>
              <MenuItem value="10">10 photos</MenuItem>
              <MenuItem value="12">12 photos</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Select how many photos should be grouped together for each listing. 
              The total number of photos must be evenly divisible by this number.
            </Typography>
          </FormControl>

          {/* Action Buttons */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
            sx={{ 
              pt: 2,
              justifyContent: 'flex-end'
            }}
          >
            <Button
              variant="outlined"
              onClick={handleReset}
              fullWidth={{ xs: true, sm: false }}
              sx={{ minWidth: { sm: '120px' } }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              fullWidth={{ xs: true, sm: false }}
              sx={{ minWidth: { sm: '150px' } }}
              disabled={selectedFiles.length === 0 || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Inventory'}
            </Button>
          </Stack>
        </Stack>
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

      {/* Progress Modal */}
      <Dialog
        open={progressModalOpen}
        aria-labelledby="progress-dialog-title"
        aria-describedby="progress-dialog-description"
        disableEscapeKeyDown
        onClose={(event, reason) => {
          // Prevent closing during processing
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
            return
          }
        }}
        PaperProps={{
          sx: {
            minWidth: { xs: '280px', sm: '400px' },
            borderRadius: 2,
          }
        }}
      >
        <DialogContent>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              py: 3,
            }}
          >
            <CircularProgress size={48} sx={{ mb: 3 }} />
            <Typography
              id="progress-dialog-title"
              variant="h6"
              component="div"
              sx={{
                textAlign: 'center',
                mb: 1,
                fontWeight: 500,
              }}
            >
              {progressMessage}
            </Typography>
            {progressMessage.includes('Uploading') && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: 'center' }}
              >
                Please wait while your images are being uploaded...
              </Typography>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  )
}

