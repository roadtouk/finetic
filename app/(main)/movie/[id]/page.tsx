import { MoviePage } from '@/components/movie-page'

export default function Movie({ params }: { params: { id: string } }) {
  return <MoviePage movieId={params.id} />
}