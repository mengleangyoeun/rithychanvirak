import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

interface Point {
  x: number
  y: number
}

interface Area {
  width: number
  height: number
  x: number
  y: number
}

interface ImageCropperProps {
  imageSrc: string
  onCropComplete: (croppedAreaPixels: Area) => void
  onCancel: () => void
  aspect?: number
}

export function ImageCropper({ imageSrc, onCropComplete, onCancel, aspect = 3 / 2 }: ImageCropperProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [croppedArea, setCroppedArea] = useState<Area | null>(null)

  const handleCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedArea)
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleCropAreaChange = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedArea)
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const renderPreview = (title: string, className: string, containerClassName: string = '') => {
    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className={`relative overflow-hidden bg-muted border rounded-md ${className}`}>
          {croppedArea && (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={imageSrc} 
              alt={`${title} Preview` }
              style={{
                position: 'absolute',
                width: `${100 / (croppedArea.width / 100)}%`,
                height: `${100 / (croppedArea.height / 100)}%`,
                left: `-${(croppedArea.x / croppedArea.width) * 100}%`,
                top: `-${(croppedArea.y / croppedArea.height) * 100}%`,
                maxWidth: 'none',
                objectFit: 'fill'
              }}
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 flex flex-col md:flex-row h-[85vh] md:h-[75vh] overflow-hidden border-zinc-800 bg-zinc-950">
        {/* Main Cropper Area */}
        <div className="flex-1 flex flex-col relative h-[50vh] md:h-full border-b md:border-b-0 md:border-r border-zinc-800">
          <DialogHeader className="p-4 border-b border-zinc-800 absolute top-0 left-0 right-0 z-10 bg-zinc-950/90 backdrop-blur-md">
            <DialogTitle className="text-base font-semibold text-white">Crop Image</DialogTitle>
          </DialogHeader>
          
          <div className="relative flex-1 bg-black overflow-hidden mt-[57px]">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onCropAreaChange={handleCropAreaChange}
              onZoomChange={setZoom}
              objectFit="contain"
              minZoom={0.1}
              restrictPosition={false}
            />
          </div>
          
          <div className="p-4 bg-zinc-950 border-t border-zinc-800 z-10 space-y-2">
            <p className="text-xs font-medium text-zinc-400">Zoom</p>
            <Slider
              value={[zoom]}
              min={0.1}
              max={3}
              step={0.01}
              onValueChange={(val) => setZoom(val[0])}
              className="py-1"
            />
          </div>
        </div>

        {/* Live Previews Sidebar */}
        <div className="w-full md:w-[320px] lg:w-[360px] p-4 flex flex-col h-[35vh] md:h-full bg-zinc-900/30">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-zinc-400 mb-4 shrink-0">Live Layout Previews</h3>
          
          <div className="flex-1 overflow-y-auto space-y-5 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
            {/* Gallery Page Layout (4:3) */}
            {renderPreview('Gallery & Homepage Card (4:3)', 'aspect-[4/3] w-full rounded-xl border-zinc-700')}
            
            {/* 3:2 standard */}
            {renderPreview('Landscape Standard (3:2)', 'aspect-[3/2] w-full rounded-xl border-zinc-700')}
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800 shrink-0 flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1 rounded-xl border-zinc-800 hover:bg-zinc-900"
            >
              Cancel
            </Button>
            <Button
              onClick={() => croppedAreaPixels && onCropComplete(croppedAreaPixels)}
              className="flex-1 rounded-xl bg-white text-black hover:bg-zinc-200"
            >
              Apply Crop
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
