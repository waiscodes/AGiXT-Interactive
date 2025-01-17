import axios from 'axios';
import { getCookie } from 'cookies-next';
import useSWR from 'swr';

// Create a custom SWR hook for a specific endpoint
export default function useProducts() {
  return useSWR(
    '/products',
    async () =>
      (
        await axios.get(`${process.env.NEXT_PUBLIC_AGIXT_SERVER}/v1/products`, {
          headers: {
            Authorization: getCookie('jwt'),
          },
        })
      ).data
        .map((x: any) => ({ ...x }))
        .sort((a: any, b: any) => (a.last_name > b.last_name ? 1 : -1)),
    {
      fallbackData: [],
    },
  );
}