export type Request = {
  body?: any;
  params?: { [key: string]: string };
  query?: { [key: string]: string };
};

export type Response = {
  status: (statusCode: number) => Response;
  json: (data: any) => void;
  send: (data: any) => void;
};
