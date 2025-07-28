"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Edit,
  Download,
  Star,
  Users,
  Image as ImageIcon,
  ArrowUp,
  ArrowDown,
  Trash2,
  X,
  GripVertical,
} from "lucide-react";
import {
  fetchRemoteImages,
  downloadRemoteImage,
  fetchCurrentImages,
  reorderBackdropImage,
  deleteImage,
  getImageUrl,
  RemoteImage,
  CurrentImage,
} from "@/app/actions";
import { TmdbIcon } from "@/components/icons/tmdb";
import { Flag } from "@/components/ui/flag";
import { toast } from "sonner";
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from "@/components/ui/sortable";

interface ImageEditorDialogProps {
  itemId: string;
  itemName: string;
  userPolicy?: {
    IsAdministrator: boolean;
    EnableMediaConversion: boolean;
    EnableContentDeletion: boolean;
  };
}

type ImageType = "Primary" | "Backdrop" | "Logo" | "Thumb";
type SortBy = "resolution" | "rating" | "votes";

const IMAGE_TYPES = [
  { key: "Primary" as ImageType, label: "Primary", icon: ImageIcon },
  { key: "Backdrop" as ImageType, label: "Backdrop", icon: ImageIcon },
  { key: "Logo" as ImageType, label: "Logo", icon: ImageIcon },
  { key: "Thumb" as ImageType, label: "Thumbnail", icon: ImageIcon },
];

export function ImageEditorDialog({
  itemId,
  itemName,
  userPolicy,
}: ImageEditorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<ImageType>("Primary");
  const [images, setImages] = useState<Record<ImageType, RemoteImage[]>>({
    Primary: [],
    Backdrop: [],
    Logo: [],
    Thumb: [],
  });
  const [loading, setLoading] = useState<Record<ImageType, boolean>>({
    Primary: false,
    Backdrop: false,
    Logo: false,
    Thumb: false,
  });
  const [downloading, setDownloading] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>("resolution");
  const [currentImages, setCurrentImages] = useState<CurrentImage[]>([]);
  const [currentImagesLoading, setCurrentImagesLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [tabMode, setTabMode] = useState<"remote" | "current">("remote");

  // Access control checks
  const canAccessImageEditor =
    userPolicy?.IsAdministrator || userPolicy?.EnableMediaConversion;
  const canDownloadImages =
    userPolicy?.IsAdministrator || userPolicy?.EnableMediaConversion;
  const canDeleteImages =
    userPolicy?.IsAdministrator || userPolicy?.EnableContentDeletion;

  const loadImages = async (type: ImageType) => {
    if (images[type].length > 0) return; // Already loaded

    setLoading((prev) => ({ ...prev, [type]: true }));
    try {
      const response = await fetchRemoteImages(itemId, type, 0, 30, false);
      setImages((prev) => ({ ...prev, [type]: response.Images }));
    } catch (error) {
      console.error(`Failed to fetch ${type} images:`, error);
      toast.error(`Failed to fetch ${type.toLowerCase()} images`);
    } finally {
      setLoading((prev) => ({ ...prev, [type]: false }));
    }
  };

  const loadCurrentImages = async () => {
    if (currentImages.length > 0) return; // Already loaded

    setCurrentImagesLoading(true);
    try {
      const images = await fetchCurrentImages(itemId);
      setCurrentImages(images);
    } catch (error) {
      console.error("Failed to fetch current images:", error);
      toast.error("Failed to fetch current images");
    } finally {
      setCurrentImagesLoading(false);
    }
  };

  const handleDownloadImage = async (image: RemoteImage) => {
    const downloadKey = `${image.Type}-${image.Url}`;
    setDownloading(downloadKey);

    try {
      await downloadRemoteImage(
        itemId,
        image.Type as ImageType,
        image.Url,
        image.ProviderName
      );
      toast.success(`${image.Type} image downloaded successfully`);
      console.log(`Downloaded ${image.Type} image:`, image);
      // Refresh current images to show the newly downloaded image
      setCurrentImages([]);
      loadCurrentImages();
    } catch (error) {
      console.error("Failed to download image:", error);
      toast.error("Failed to download image");
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteCurrentImage = async (image: CurrentImage) => {
    const deleteKey = `${image.ImageType}-${image.ImageIndex || 0}`;
    setDeleting(deleteKey);

    try {
      await deleteImage(itemId, image.ImageType, image.ImageIndex);
      toast.success(`${image.ImageType} image deleted successfully`);
      // Remove the deleted image from the state
      setCurrentImages((prev) =>
        prev.filter(
          (img) =>
            !(
              img.ImageType === image.ImageType &&
              img.ImageIndex === image.ImageIndex
            )
        )
      );
    } catch (error) {
      console.error("Failed to delete image:", error);
      toast.error("Failed to delete image");
    } finally {
      setDeleting(null);
    }
  };

  const handleReorderBackdrops = async (newBackdrops: CurrentImage[]) => {
    const oldBackdrops = currentImages.filter(
      (img) => img.ImageType === "Backdrop"
    );

    // Find the changes and apply them
    for (let newIndex = 0; newIndex < newBackdrops.length; newIndex++) {
      const newImage = newBackdrops[newIndex];
      const oldIndex = oldBackdrops.findIndex(
        (img) => img.ImageTag === newImage.ImageTag
      );

      if (oldIndex !== -1 && oldIndex !== newIndex) {
        try {
          await reorderBackdropImage(itemId, oldIndex, newIndex);
        } catch (error) {
          console.error("Failed to reorder backdrop:", error);
          toast.error("Failed to reorder backdrop image");
          return; // Stop on first error
        }
      }
    }

    // Update the local state
    setCurrentImages((prev) => {
      const nonBackdrops = prev.filter((img) => img.ImageType !== "Backdrop");
      return [...nonBackdrops, ...newBackdrops];
    });

    toast.success("Backdrop images reordered successfully");
  };

  useEffect(() => {
    if (isOpen) {
      if (tabMode === "remote") {
        loadImages(selectedType);
      } else {
        loadCurrentImages();
      }
    }
  }, [isOpen, selectedType, tabMode]);

  const formatFileSize = (width: number, height: number) => {
    return `${width} × ${height}`;
  };

  const getLanguageDisplay = (language: string) => {
    if (!language || language === "null") return "No Language";
    return language.toUpperCase();
  };

  const sortImages = (images: RemoteImage[], sortBy: SortBy): RemoteImage[] => {
    return [...images].sort((a, b) => {
      switch (sortBy) {
        case "resolution":
          const aResolution = a.Width * a.Height;
          const bResolution = b.Width * b.Height;
          return bResolution - aResolution; // Highest resolution first
        case "rating":
          const aRating = a.CommunityRating || 0;
          const bRating = b.CommunityRating || 0;
          return bRating - aRating; // Highest rating first
        case "votes":
          const aVotes = a.VoteCount || 0;
          const bVotes = b.VoteCount || 0;
          return bVotes - aVotes; // Most votes first
        default:
          return 0;
      }
    });
  };

  // Component to handle async image URL loading
  const CurrentImageDisplay = ({
    image,
    className,
    alt,
  }: {
    image: CurrentImage;
    className?: string;
    alt?: string;
  }) => {
    const [imageUrl, setImageUrl] = useState<string>("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      let isMounted = true;

      const loadImageUrl = async () => {
        try {
          // For backdrop images, we need to include the index in the image type
          const imageType =
            image.ImageType === "Backdrop" && image.ImageIndex !== undefined
              ? `${image.ImageType}/${image.ImageIndex}`
              : image.ImageType;

          const url = await getImageUrl(
            itemId,
            imageType,
            90, // quality
            image.ImageTag,
            700, // maxWidth
            undefined // maxHeight
          );
          if (isMounted) {
            setImageUrl(url);
            setLoading(false);
          }
        } catch (error) {
          console.error("Failed to get image URL:", error);
          if (isMounted) {
            // Fallback: construct a basic Jellyfin image URL
            const imageType =
              image.ImageType === "Backdrop" && image.ImageIndex !== undefined
                ? `${image.ImageType}/${image.ImageIndex}`
                : image.ImageType;

            setImageUrl(
              `/Items/${itemId}/Images/${imageType}?tag=${image.ImageTag}&maxWidth=700&quality=90`
            );
            setLoading(false);
          }
        }
      };

      loadImageUrl();

      return () => {
        isMounted = false;
      };
    }, [image.ImageTag, image.ImageType, image.ImageIndex]);

    if (loading) {
      return <Skeleton className={className} />;
    }

    return (
      <img
        src={imageUrl}
        alt={alt || `${image.ImageType} ${image.ImageIndex || 0}`}
        className={className}
        loading="lazy"
      />
    );
  };

  // Don't render the component if user doesn't have access
  if (!canAccessImageEditor) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] dark:bg-background/95 backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="font-poppins">
            Edit Images • {itemName}
          </DialogTitle>
        </DialogHeader>

        {/* Top-level tabs for Remote vs Current */}
        <Tabs
          value={tabMode}
          onValueChange={(value) => setTabMode(value as "remote" | "current")}
        >
          <div className="flex items-center justify-between w-full mb-4">
            <TabsList>
              <TabsTrigger value="remote">Remote Images</TabsTrigger>
              <TabsTrigger value="current">Current Images</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="remote">
            {/* Remote Images - Image Type Tabs */}
            <Tabs
              value={selectedType}
              onValueChange={(value) => setSelectedType(value as ImageType)}
            >
              <div className="flex items-center justify-between w-full">
                <TabsList className="flex-1">
                  {IMAGE_TYPES.map(({ key, label, icon: Icon }) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="flex items-center gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortBy)}
                >
                  <SelectTrigger className="w-[180px] ml-4">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="z-[100000]">
                    <SelectItem value="resolution">Resolution</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="votes">Votes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {IMAGE_TYPES.map(({ key }) => (
                <TabsContent key={key} value={key} className="mt-4">
                  <ScrollArea className="h-[50vh]">
                    {loading[key] ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                          <Card
                            key={index}
                            className="overflow-hidden py-0 gap-0"
                          >
                            <div className="relative aspect-video p-3">
                              <Skeleton className="w-full h-full rounded-lg" />
                            </div>
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-8 w-full" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : images[key].length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No {key.toLowerCase()} images available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {sortImages(images[key], sortBy).map((image, index) => (
                          <Card
                            key={index}
                            className="overflow-hidden py-0 gap-0"
                          >
                            <div className="relative aspect-video p-3">
                              <img
                                src={image.Url}
                                alt={`${key} option ${index + 1}`}
                                className="w-full h-full object-cover rounded-lg"
                                loading="lazy"
                              />
                            </div>
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex gap-2">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {image.ProviderName === "TheMovieDb"
                                      ? "TMDB"
                                      : image.ProviderName}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {formatFileSize(image.Width, image.Height)}
                                  </Badge>
                                </div>
                                {canDownloadImages && (
                                  <Button
                                    onClick={() => handleDownloadImage(image)}
                                    disabled={
                                      downloading ===
                                      `${image.Type}-${image.Url}`
                                    }
                                    className="w-full"
                                    size="sm"
                                    variant="outline"
                                  >
                                    <Download className="h-4 w-4" />
                                    {downloading ===
                                    `${image.Type}-${image.Url}`
                                      ? "Downloading..."
                                      : "Download"}
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          <TabsContent value="current">
            <ScrollArea className="h-[60vh]">
              {currentImagesLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="relative aspect-video p-3">
                        <Skeleton className="w-full h-full rounded-lg" />
                      </div>
                      <CardContent className="p-3">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-3/4" />
                          <div className="flex gap-2">
                            <Skeleton className="h-8 flex-1" />
                            <Skeleton className="h-8 w-8" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : currentImages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No current images found</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Group images by type */}
                  {IMAGE_TYPES.map(({ key, label }) => {
                    const imagesOfType = currentImages.filter(
                      (img) => img.ImageType === key
                    );
                    if (imagesOfType.length === 0) return null;

                    return (
                      <div key={key}>
                        <h3 className="text-lg font-semibold mb-3">
                          {label} Images
                        </h3>
                        {key === "Backdrop" && imagesOfType.length > 1 ? (
                          // Special sortable handling for backdrops
                          <Sortable
                            value={imagesOfType}
                            onValueChange={handleReorderBackdrops}
                            getItemValue={(image) => image.ImageTag}
                            orientation="mixed"
                          >
                            <SortableContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {imagesOfType.map((image) => (
                                <SortableItem
                                  key={image.ImageTag}
                                  value={image.ImageTag}
                                  className="relative group"
                                >
                                  <Card className="overflow-hidden relative">
                                    <div className="absolute top-2 right-2 z-10">
                                      {canDeleteImages && (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={() =>
                                            handleDeleteCurrentImage(image)
                                          }
                                          disabled={
                                            deleting ===
                                            `${image.ImageType}-${image.ImageIndex || 0}`
                                          }
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                    <div className="absolute top-2 left-2 z-10">
                                      <SortableItemHandle className="h-8 w-8 p-1 bg-background/90 backdrop-blur-sm border rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hover:cursor-grabbing">
                                        <GripVertical className="h-4 w-4" />
                                      </SortableItemHandle>
                                    </div>
                                    <div className="relative aspect-video p-3">
                                      <CurrentImageDisplay
                                        image={image}
                                        className="w-full h-full object-cover rounded-lg"
                                        alt={`${image.ImageType} ${image.ImageIndex || 0}`}
                                      />
                                    </div>
                                    <CardContent className="p-3">
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <Badge
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {image.ImageIndex !== undefined
                                              ? `Index: ${image.ImageIndex}`
                                              : "Primary"}
                                          </Badge>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            {formatFileSize(
                                              image.Width,
                                              image.Height
                                            )}
                                          </Badge>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                </SortableItem>
                              ))}
                            </SortableContent>
                            <SortableOverlay>
                              {({ value }) => {
                                const image = imagesOfType.find(
                                  (img) => img.ImageTag === value
                                );
                                return image ? (
                                  <Card className="overflow-hidden opacity-75">
                                    <div className="relative aspect-video p-3">
                                      <CurrentImageDisplay
                                        image={image}
                                        className="w-full h-full object-cover rounded-lg"
                                        alt={`${image.ImageType} ${image.ImageIndex || 0}`}
                                      />
                                    </div>
                                  </Card>
                                ) : null;
                              }}
                            </SortableOverlay>
                          </Sortable>
                        ) : (
                          // Regular grid for non-backdrop images or single backdrops
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {imagesOfType.map((image) => (
                              <Card
                                key={`${image.ImageType}-${image.ImageIndex || 0}`}
                                className="overflow-hidden relative group"
                              >
                                <div className="absolute top-2 right-2 z-10">
                                  {canDeleteImages && (
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() =>
                                        handleDeleteCurrentImage(image)
                                      }
                                      disabled={
                                        deleting ===
                                        `${image.ImageType}-${image.ImageIndex || 0}`
                                      }
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                <div className="relative aspect-video p-3">
                                  <CurrentImageDisplay
                                    image={image}
                                    className="w-full h-full object-cover rounded-lg"
                                  />
                                </div>
                                <CardContent className="p-3">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {image.ImageIndex !== undefined
                                          ? `Index: ${image.ImageIndex}`
                                          : "Primary"}
                                      </Badge>
                                      <Badge
                                        variant="secondary"
                                        className="text-xs"
                                      >
                                        {formatFileSize(
                                          image.Width,
                                          image.Height
                                        )}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
