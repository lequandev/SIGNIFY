import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../../services/api';

export const packageApi = createApi({
  reducerPath: 'packageApi',
  baseQuery: fetchBaseQuery({ baseUrl: API_BASE_URL }),
  endpoints: (builder) => ({
    getPackages: builder.query<any[], void>({
      query: () => '/packages',
    }),
  }),
});

export const { useGetPackagesQuery } = packageApi;
