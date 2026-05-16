import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const packageApi = createApi({
  reducerPath: 'packageApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5000/api' }),
  endpoints: (builder) => ({
    getPackages: builder.query<any[], void>({
      query: () => '/packages',
    }),
  }),
});

export const { useGetPackagesQuery } = packageApi;
