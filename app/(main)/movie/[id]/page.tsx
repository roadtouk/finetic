import { MoviePage } from '@/components/movie-page'

interface MovieProps {
  params: {
    id: string;
  };
}

export default function Movie({ params }: MovieProps) {
  return <MoviePage movieId={params.id} />
}