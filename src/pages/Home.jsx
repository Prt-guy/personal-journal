// Home — deliberately bare. Just the title and two ways in.
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

export default function Home() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-10 text-4xl font-semibold tracking-tight text-stone-800 dark:text-stone-100 sm:text-5xl lg:mb-14 lg:text-6xl xl:text-7xl">
        My Journal
      </h1>
      <div className="flex w-full max-w-xs flex-col gap-3 sm:max-w-md sm:flex-row sm:justify-center lg:max-w-lg lg:gap-4">
        <Button
          size="lg"
          className="w-full px-10 py-4 sm:w-auto lg:text-lg"
          onClick={() => navigate('/new')}
        >
          New Journal
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="w-full px-10 py-4 sm:w-auto lg:text-lg"
          onClick={() => navigate('/history')}
        >
          History
        </Button>
      </div>
    </div>
  );
}
