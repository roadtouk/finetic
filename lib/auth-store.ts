import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

import { JellyfinUser, JellyfinItem } from '../types/jellyfin'

interface AuthState {
  serverUrl: string | null
  user: JellyfinUser | null
  isAuthenticated: boolean
  setServerUrl: (url: string) => void
  setUser: (user: JellyfinUser) => void
  logout: () => void
  checkServerHealth: (url: string) => Promise<boolean>
  authenticateUser: (username: string, password: string) => Promise<boolean>
  fetchMovies: (limit?: number) => Promise<JellyfinItem[]>
  fetchTVShows: (limit?: number) => Promise<JellyfinItem[]>
  searchItems: (query: string) => Promise<JellyfinItem[]>
  fetchMovieDetails: (movieId: string) => Promise<JellyfinItem | null>,
  getImageUrl: (itemId: string, imageType?: string, tag?: string) => string
  getDownloadUrl: (itemId: string, mediaSourceId: string) => string
  getStreamUrl: (itemId: string, mediaSourceId: string, quality?: string) => string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      serverUrl: null,
      user: null,
      isAuthenticated: false,

      setServerUrl: (url: string) => {
        set({ serverUrl: url })
      },

      setUser: (user: JellyfinUser) => {
        set({ user, isAuthenticated: true })
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, serverUrl: null })
      },

      checkServerHealth: async (url: string): Promise<boolean> => {
        try {
          // Remove trailing slash and ensure proper URL format
          const cleanUrl = url.replace(/\/$/, '')
          const response = await axios.get(`${cleanUrl}/System/Info/Public`, {
            timeout: 5000,
            headers: {
              'Accept': 'application/json',
            }
          })
          return response.status === 200 && response.data.ServerName
        } catch (error) {
          console.error('Server health check failed:', error)
          return false
        }
      },

      authenticateUser: async (username: string, password: string): Promise<boolean> => {
        try {
          const { serverUrl } = get()
          if (!serverUrl) return false

          const response = await axios.post(`${serverUrl}/Users/AuthenticateByName`, {
            Username: username,
            Pw: password
          }, {
            headers: {
              'Content-Type': 'application/json',
              'X-Emby-Authorization': 'MediaBrowser Client="Jellyfin Web Client", Device="Browser", DeviceId="web-client", Version="1.0.0"'
            }
          })

          if (response.status === 200 && response.data.AccessToken) {
            const user: JellyfinUser = {
              Id: response.data.User.Id,
              Name: response.data.User.Name,
              AccessToken: response.data.AccessToken
            }
            set({ user, isAuthenticated: true })
            return true
          }
          return false
        } catch (error) {
          console.error('Authentication failed:', error)
          return false
        }
      },

      fetchMovies: async (limit: number = 20): Promise<JellyfinItem[]> => {
        try {
          const { serverUrl, user } = get()
          if (!serverUrl || !user) return []

          const response = await axios.get(`${serverUrl}/Items`, {
            params: {
              userId: user.Id,
              includeItemTypes: 'Movie',
              recursive: true,
              sortBy: 'DateCreated',
              sortOrder: 'Descending',
              limit: limit,
              fields: 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,CommunityRating,Overview'
            },
            headers: {
              'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Web Client", Device="Browser", DeviceId="web-client", Version="1.0.0", Token="${user.AccessToken}"`
            }
          })

          return response.data.Items || []
        } catch (error) {
          console.error('Failed to fetch movies:', error)
          return []
        }
      },

      fetchTVShows: async (limit: number = 20): Promise<JellyfinItem[]> => {
        try {
          const { serverUrl, user } = get()
          if (!serverUrl || !user) return []

          const response = await axios.get(`${serverUrl}/Items`, {
            params: {
              userId: user.Id,
              includeItemTypes: 'Series',
              recursive: true,
              sortBy: 'DateCreated',
              sortOrder: 'Descending',
              limit: limit,
              fields: 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,CommunityRating,Overview'
            },
            headers: {
              'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Web Client", Device="Browser", DeviceId="web-client", Version="1.0.0", Token="${user.AccessToken}"`
            }
          })

          return response.data.Items || []
        } catch (error) {
          console.error('Failed to fetch TV shows:', error)
          return []
        }
      },

      searchItems: async (query: string): Promise<JellyfinItem[]> => {
        try {
          const { serverUrl, user } = get()
          if (!serverUrl || !user || !query.trim()) return []

          const response = await axios.get(`${serverUrl}/Items`, {
            params: {
              userId: user.Id,
              searchTerm: query,
              includeItemTypes: 'Movie,Series,Episode',
              recursive: true,
              limit: 50,
              fields: 'BasicSyncInfo,CanDelete,PrimaryImageAspectRatio,ProductionYear,CommunityRating,Overview'
            },
            headers: {
              'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Web Client", Device="Browser", DeviceId="web-client", Version="1.0.0", Token="${user.AccessToken}"`
            }
          })

          const items = response.data.Items || []
          
          // Sort items to prioritize Movies and Series over Episodes
          return items.sort((a: JellyfinItem, b: JellyfinItem) => {
            const typePriority = { 'Movie': 1, 'Series': 2, 'Episode': 3 }
            const aPriority = typePriority[a.Type as keyof typeof typePriority] || 4
            const bPriority = typePriority[b.Type as keyof typeof typePriority] || 4
            return aPriority - bPriority
          })
        } catch (error) {
          console.error('Failed to search items:', error)
          return []
        }
      },

      getImageUrl: (itemId: string, imageType: string = 'Primary', tag?: string): string => {
        const { serverUrl } = get()
        if (!serverUrl) return ''
        
        let url = `${serverUrl}/Items/${itemId}/Images/${imageType}`
        if (tag) {
          url += `?tag=${tag}`
        }
        return url
      },

      fetchMovieDetails: async (movieId: string): Promise<JellyfinItem | null> => {
        try {
          const { serverUrl, user } = get()
          if (!serverUrl || !user) return null

          const response = await axios.get(`${serverUrl}/Users/${user.Id}/Items/${movieId}`, {
            headers: {
              'X-Emby-Authorization': `MediaBrowser Client="Jellyfin Web Client", Device="Browser", DeviceId="web-client", Version="1.0.0", Token="${user.AccessToken}"`
            }
          })

          return response.data
        } catch (error) {
          console.error('Failed to fetch movie details:', error)
          return null
        }
      },

      getDownloadUrl: (itemId: string, mediaSourceId: string): string => {
        const { serverUrl, user } = get()
        if (!serverUrl || !user) return ''
        return `${serverUrl}/Items/${itemId}/Download?api_key=${user.AccessToken}&MediaSourceId=${mediaSourceId}`
      },

      getStreamUrl: (itemId: string, mediaSourceId: string, quality?: string): string => {
        const { serverUrl, user } = get()
        if (!serverUrl || !user) return ''
        let url = `${serverUrl}/Videos/${itemId}/master.m3u8?api_key=${user.AccessToken}&MediaSourceId=${mediaSourceId}&PlaySessionId=${user.Id}&VideoCodec=h264,hevc&AudioCodec=aac,mp3&TranscodingProfile=Default`

        if (quality) {
          switch (quality) {
            case '2160p':
              url += '&width=3840&height=2160&videoBitRate=20000000'
              break
            case '1080p':
              url += '&width=1920&height=1080&videoBitRate=8000000'
              break
            case '720p':
              url += '&width=1280&height=720&videoBitRate=4000000'
              break
          }
        }

        return url
      }
    }),
    {
      name: 'jellyfin-auth',
      partialize: (state) => ({
        serverUrl: state.serverUrl,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
