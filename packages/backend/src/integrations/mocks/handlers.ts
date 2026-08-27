import { http, HttpResponse } from 'msw';

export interface MockMessage {
  id: string;
  threadId: string | null;
  from: string;
  to: string[];
  subject: string | null;
  snippet: string | null;
  body: string | null;
  receivedAt: string | null;
  isRead: boolean;
}

export function createHandlers(baseUrl: string, messages: MockMessage[]) {
  const base = baseUrl.replace(/\/+$/, '');
  return [
    http.get(`${base}/messages`, ({ request }) => {
      const url = new URL(request.url);
      const maxResults = url.searchParams.get('maxResults');
      const pageToken = url.searchParams.get('pageToken');
      const offset = pageToken ? Number.parseInt(pageToken, 10) : 0;
      const start = Number.isNaN(offset) || offset < 0 ? 0 : offset;
      const limit = maxResults ? Number.parseInt(maxResults, 10) : messages.length;
      const slice = messages.slice(start, start + limit);
      const nextOffset = start + slice.length;
      const nextPageToken = nextOffset < messages.length ? String(nextOffset) : undefined;
      return HttpResponse.json(
        nextPageToken ? { messages: slice, nextPageToken } : { messages: slice },
      );
    }),

    http.get(`${base}/messages/:id`, ({ params }) => {
      const msg = messages.find((m) => m.id === params.id);
      if (!msg) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(msg);
    }),

    http.get(`${base}/health`, () => HttpResponse.json({ status: 'ok' })),
  ];
}
