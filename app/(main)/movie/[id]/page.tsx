import { MoviePage } from "@/components/movie-page";

interface MovieProps {
  params: {
    id: string;
  };
}

export default async function Movie({ params }: MovieProps) {
  const { id } = await params;
  return <MoviePage movieId={id} />;
}
