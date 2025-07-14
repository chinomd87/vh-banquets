import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, doc, deleteDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

// Allowed file types for uploads
export const ALLOWED_FILE_TYPES = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  txt: 'text/plain',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png'
};

// Maximum file size (10MB)
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Validates if a file is allowed for upload
 * @param {File} file - The file to validate
 * @returns {Object} - Validation result with isValid and error properties
 */
export function validateFile(file) {
  if (!file) {
    return { isValid: false, error: 'No file selected' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { 
      isValid: false, 
      error: `File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
    };
  }

  // Check file type
  const fileExtension = file.name.split('.').pop().toLowerCase();
  if (!ALLOWED_FILE_TYPES[fileExtension]) {
    const allowedTypes = Object.keys(ALLOWED_FILE_TYPES).join(', ');
    return { 
      isValid: false, 
      error: `File type not allowed. Allowed types: ${allowedTypes}` 
    };
  }

  // Check MIME type
  if (file.type && ALLOWED_FILE_TYPES[fileExtension] !== file.type) {
    return { 
      isValid: false, 
      error: 'File type does not match file extension' 
    };
  }

  return { isValid: true };
}

/**
 * Uploads a file to Firebase Storage and stores metadata in Firestore
 * @param {File} file - The file to upload
 * @param {string} eventId - The ID of the event this file belongs to
 * @param {Object} storage - Firebase Storage instance
 * @param {Object} db - Firestore database instance
 * @param {string} userId - The ID of the user uploading the file
 * @param {Function} onProgress - Callback for upload progress (optional)
 * @returns {Promise<Object>} - Upload result with file metadata
 */
export async function uploadEventFile(file, eventId, storage, db, userId, onProgress = null) {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Create unique filename
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;
    const filePath = `events/${eventId}/files/${fileName}`;

    // Create storage reference
    const storageRef = ref(storage, filePath);

    // Start upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress(progress);
          }
        },
        (error) => {
          console.error('Upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Store file metadata in Firestore
            const fileMetadata = {
              eventId,
              fileName: file.name,
              originalName: file.name,
              fileSize: file.size,
              fileType: file.type,
              fileExtension: file.name.split('.').pop().toLowerCase(),
              downloadURL,
              storagePath: filePath,
              uploadedBy: userId,
              uploadedAt: new Date(),
              createdAt: new Date()
            };

            const docRef = await addDoc(collection(db, 'eventFiles'), fileMetadata);
            
            const result = {
              id: docRef.id,
              ...fileMetadata
            };

            toast.success(`File "${file.name}" uploaded successfully`);
            resolve(result);
          } catch (error) {
            console.error('Error saving file metadata:', error);
            reject(new Error(`Failed to save file metadata: ${error.message}`));
          }
        }
      );
    });
  } catch (error) {
    console.error('Upload error:', error);
    toast.error(error.message);
    throw error;
  }
}

/**
 * Deletes a file from Firebase Storage and removes metadata from Firestore
 * @param {string} fileId - The Firestore document ID of the file
 * @param {string} storagePath - The storage path of the file
 * @param {Object} storage - Firebase Storage instance
 * @param {Object} db - Firestore database instance
 * @returns {Promise<void>}
 */
export async function deleteEventFile(fileId, storagePath, storage, db) {
  try {
    // Delete from Storage
    if (storagePath) {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    }

    // Delete metadata from Firestore
    await deleteDoc(doc(db, 'eventFiles', fileId));

    toast.success('File deleted successfully');
  } catch (error) {
    console.error('Delete error:', error);
    toast.error(`Failed to delete file: ${error.message}`);
    throw error;
  }
}

/**
 * Gets all files for a specific event
 * @param {string} eventId - The ID of the event
 * @param {Object} db - Firestore database instance
 * @returns {Promise<Array>} - Array of file metadata objects
 */
export async function getEventFiles(eventId, db) {
  try {
    const q = query(
      collection(db, 'eventFiles'),
      where('eventId', '==', eventId)
    );
    
    const querySnapshot = await getDocs(q);
    const files = [];
    
    querySnapshot.forEach((doc) => {
      files.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by upload date, newest first
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    
    return files;
  } catch (error) {
    console.error('Error fetching event files:', error);
    throw error;
  }
}

/**
 * Updates file metadata in Firestore
 * @param {string} fileId - The Firestore document ID of the file
 * @param {Object} updates - Object containing the fields to update
 * @param {Object} db - Firestore database instance
 * @returns {Promise<void>}
 */
export async function updateEventFile(fileId, updates, db) {
  try {
    await updateDoc(doc(db, 'eventFiles', fileId), {
      ...updates,
      updatedAt: new Date()
    });
    
    toast.success('File updated successfully');
  } catch (error) {
    console.error('Error updating file:', error);
    toast.error(`Failed to update file: ${error.message}`);
    throw error;
  }
}

/**
 * Gets the file type icon based on file extension
 * @param {string} fileExtension - The file extension
 * @returns {string} - Icon name from lucide-react
 */
export function getFileIcon(fileExtension) {
  const extension = fileExtension?.toLowerCase();
  
  switch (extension) {
    case 'pdf':
      return 'FileText';
    case 'doc':
    case 'docx':
      return 'FileType';
    case 'txt':
      return 'FileText';
    case 'jpg':
    case 'jpeg':
    case 'png':
      return 'Image';
    default:
      return 'File';
  }
}

/**
 * Formats file size in human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Updates the event ID for all files associated with a temporary event ID
 * @param {string} tempEventId - The temporary event ID
 * @param {string} realEventId - The real event ID
 * @param {Object} db - Firestore database instance
 * @returns {Promise<void>}
 */
export async function updateEventIdForFiles(tempEventId, realEventId, db) {
  try {
    const q = query(
      collection(db, 'eventFiles'),
      where('eventId', '==', tempEventId)
    );
    
    const querySnapshot = await getDocs(q);
    const updatePromises = [];
    
    querySnapshot.forEach((docSnapshot) => {
      const updatePromise = updateDoc(doc(db, 'eventFiles', docSnapshot.id), {
        eventId: realEventId,
        updatedAt: new Date()
      });
      updatePromises.push(updatePromise);
    });

    await Promise.all(updatePromises);
    console.log(`Updated ${updatePromises.length} files with new event ID: ${realEventId}`);
  } catch (error) {
    console.error('Error updating event ID for files:', error);
    throw error;
  }
}
