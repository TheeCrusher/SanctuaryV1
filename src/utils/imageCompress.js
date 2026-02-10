// =============================================================================
// IMAGE COMPRESSION UTILITY
// =============================================================================
// Compresses an image file using an off-screen canvas.
// Resizes to fit within maxSize (default 300x300) and outputs JPEG at 0.8 quality.
// Returns a base64 data URL string (~30-50KB typical output).
//
// Usage:
//   import { compressImage } from '../utils/imageCompress'
//   const dataUrl = await compressImage(file)

const MAX_SIZE = 300
const QUALITY = 0.8

export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onloadend = () => {
      img.src = reader.result
    }

    reader.onerror = reject

    img.onload = () => {
      // Calculate new dimensions (fit within MAX_SIZE, keep aspect ratio)
      let { width, height } = img

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round(height * (MAX_SIZE / width))
          width = MAX_SIZE
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round(width * (MAX_SIZE / height))
          height = MAX_SIZE
        }
      }

      // Draw to canvas at the new size
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Export as JPEG data URL
      const dataUrl = canvas.toDataURL('image/jpeg', QUALITY)
      resolve(dataUrl)
    }

    img.onerror = () => reject(new Error('Failed to load image'))

    reader.readAsDataURL(file)
  })
}
