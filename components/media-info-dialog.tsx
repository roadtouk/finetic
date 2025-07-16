'use client'

import React from 'react'

import { MediaSourceInfo, MediaStream } from '../types/jellyfin'

interface MediaInfoDialogProps {
  mediaSource: MediaSourceInfo
}

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function MediaInfoDialog({ mediaSource }: MediaInfoDialogProps) {
  if (!mediaSource) return null

  const videoStream = mediaSource.MediaStreams.find((s: MediaStream) => s.Type === 'Video')
  const audioStreams = mediaSource.MediaStreams.filter((s: MediaStream) => s.Type === 'Audio')
  const subtitleStreams = mediaSource.MediaStreams.filter((s: MediaStream) => s.Type === 'Subtitle')

  return (
    <div className="text-sm">
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <div className="font-semibold">Container</div>
        <div>{mediaSource.Container}</div>

        <div className="font-semibold">Size</div>
        <div>{formatBytes(mediaSource.Size)}</div>

        <div className="font-semibold">Path</div>
        <div className="truncate">{mediaSource.Path}</div>
      </div>

      {videoStream && (
        <div className="mt-4">
          <h4 className="font-semibold text-lg mb-2">Video</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 pl-4">
            <div className="font-semibold">Codec</div>
            <div>{videoStream.Codec}</div>

            <div className="font-semibold">Resolution</div>
            <div>{videoStream.Width}x{videoStream.Height}</div>

            <div className="font-semibold">Bitrate</div>
            <div>{Math.round(videoStream.BitRate / 1000)} kbps</div>

            <div className="font-semibold">Frame Rate</div>
            <div>{videoStream.AverageFrameRate} fps</div>
          </div>
        </div>
      )}

      {audioStreams.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-lg mb-2">Audio</h4>
          {audioStreams.map((stream: MediaStream, index: number) => (
            <div key={index} className="pl-4 mb-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="font-semibold">Language</div>
                <div>{stream.Language || 'Unknown'}</div>

                <div className="font-semibold">Codec</div>
                <div>{stream.Codec}</div>

                <div className="font-semibold">Channels</div>
                <div>{stream.Channels}</div>

                <div className="font-semibold">Bitrate</div>
                <div>{Math.round(stream.BitRate / 1000)} kbps</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {subtitleStreams.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-lg mb-2">Subtitles</h4>
          {subtitleStreams.map((stream: MediaStream, index: number) => (
            <div key={index} className="pl-4 mb-2">
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="font-semibold">Language</div>
                <div>{stream.Language || 'Unknown'}</div>

                <div className="font-semibold">Format</div>
                <div>{stream.Codec}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
