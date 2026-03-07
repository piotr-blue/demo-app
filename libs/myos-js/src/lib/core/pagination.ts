export interface PaginatedResult<TItem> {
  readonly items: readonly TItem[];
  readonly nextPageToken?: string;
}

export interface PaginationRequest {
  readonly nextPageToken?: string;
}

export type PaginationFetcher<TItem, TParams extends PaginationRequest> = (
  params?: TParams,
) => Promise<PaginatedResult<TItem>>;

export async function* paginate<TItem, TParams extends PaginationRequest>(
  fetchPage: PaginationFetcher<TItem, TParams>,
  initialParams?: TParams,
): AsyncIterable<TItem> {
  let params = initialParams;
  while (true) {
    const page = await fetchPage(params);
    for (const item of page.items) {
      yield item;
    }
    if (!page.nextPageToken) {
      break;
    }
    params = {
      ...(params ?? ({} as TParams)),
      nextPageToken: page.nextPageToken,
    };
  }
}
