param (
    [Parameter(Mandatory=$true)] [string]$srcFile,
    [Parameter(Mandatory=$true)] [string]$destMain,
    [Parameter(Mandatory=$true)] [string]$destThumb
)

Add-Type -AssemblyName System.Drawing

function Resize-And-Save {
    param($srcBmp, $maxDim, $outFile)
    
    $origW = $srcBmp.Width
    $origH = $srcBmp.Height
    
    $targetW = $origW
    $targetH = $origH
    
    if ($origW -gt $maxDim -or $origH -gt $maxDim) {
        if ($origW -gt $origH) {
            $targetW = $maxDim
            $targetH = [int](($origH * $maxDim) / $origW)
        } else {
            $targetH = $maxDim
            $targetW = [int](($origW * $maxDim) / $origH)
        }
    }
    
    $destBmp = New-Object System.Drawing.Bitmap([int]$targetW, [int]$targetH)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $srcRect = New-Object System.Drawing.Rectangle 0, 0, $origW, $origH
    $destRect = New-Object System.Drawing.Rectangle 0, 0, $targetW, $targetH
    $g.DrawImage($srcBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    
    # Save as JPEG with 88% quality or PNG based on extension
    $ext = [System.IO.Path]::GetExtension($outFile).ToLower()
    if ($ext -eq ".png") {
        $destBmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    } else {
        $destBmp.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Jpeg)
    }
    $destBmp.Dispose()
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcFile)
# Main image max 2000px
Resize-And-Save -srcBmp $bmp -maxDim 2000 -outFile $destMain
# Thumbnail max 400px
Resize-And-Save -srcBmp $bmp -maxDim 400 -outFile $destThumb
$bmp.Dispose()

Write-Output "OPTIMIZATION_SUCCESS"
