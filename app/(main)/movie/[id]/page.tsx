import { MoviePage } from "@/components/movie-page";

export default async function Movie({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <MoviePage movieId={id} />;
}
