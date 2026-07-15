import { useQuery } from '@tanstack/react-query';

export const useDemoQuery = () => {
  return useQuery(['demo'], async () => {
    const res = await fetch('/api/hello');
    if (!res.ok) throw new Error('Network error');
    return res.json();
  });
};
