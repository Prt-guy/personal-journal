// Simple not-found fallback for unknown routes.
import { useNavigate } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <EmptyState
      icon="🧭"
      title="Page not found"
      message="This page doesn't exist. Let's get you back to your journal."
      action={<Button onClick={() => navigate('/')}>Go home</Button>}
    />
  );
}
