import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { Upload, FileText, X, Trash2 } from 'lucide-react'

interface FileUploaderProps {
  files: File[]
  onFilesSelect: (files: File[]) => void
  onFileRemove: (index: number) => void
  onFilesClear: () => void
  disabled?: boolean
  maxFiles?: number
}

export function FileUploader({ files, onFilesSelect, onFileRemove, onFilesClear, disabled, maxFiles = 10 }: FileUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const combined = [...files, ...acceptedFiles].slice(0, maxFiles)
        onFilesSelect(combined)
      }
    },
    [files, onFilesSelect, maxFiles],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: maxFiles - files.length,
    maxSize: 10 * 1024 * 1024,
    disabled,
    multiple: true,
  })

  const rootProps = getRootProps()

  return (
    <div className="space-y-3">
      <motion.div
        whileHover={disabled ? {} : { scale: 1.01 }}
        whileTap={disabled ? {} : { scale: 0.99 }}
        onClick={rootProps.onClick}
        onKeyDown={rootProps.onKeyDown}
        role={rootProps.role}
        tabIndex={rootProps.tabIndex}
        ref={rootProps.ref}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
          isDragActive
            ? 'border-accent-500 bg-accent-500/10'
            : 'border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/[0.08]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto mb-3 h-8 w-8 text-white/40" />
        <p className="mb-1 font-medium">
          {isDragActive ? 'Drop your invoices here' : 'Drag & drop invoices'}
        </p>
        <p className="text-sm text-white/40">
          or click to browse. PDF only, max 10MB each. Up to {maxFiles} files.
        </p>
      </motion.div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/60">
              {files.length} file{files.length !== 1 ? 's' : ''} selected
            </p>
            {files.length > 1 && !disabled && (
              <button
                onClick={onFilesClear}
                className="flex items-center gap-1 text-xs text-white/40 hover:text-red-400 cursor-pointer"
              >
                <Trash2 className="h-3 w-3" /> Clear all
              </button>
            )}
          </div>
          {files.map((file, index) => (
            <div key={`${file.name}-${index}`} className="glass flex items-center gap-3 rounded-xl p-3">
              <div className="rounded-lg bg-primary-500/20 p-2">
                <FileText className="h-4 w-4 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium">{file.name}</p>
                <p className="text-xs text-white/40">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              {!disabled && (
                <button
                  onClick={() => onFileRemove(index)}
                  className="rounded-lg p-1.5 text-white/40 hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
