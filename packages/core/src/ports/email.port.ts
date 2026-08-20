export interface Email {
  id: string;
  accountId: string;
  threadId: string | null;
  fromAddress: string;
  toAddress: string;
  subject: string | null;
  snippet: string | null;
  body: string | null;
  isRead: boolean;
  receivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateEmailInput {
  id?: string;
  accountId: string;
  threadId?: string | null;
  fromAddress: string;
  toAddress: string;
  subject?: string | null;
  snippet?: string | null;
  body?: string | null;
  isRead?: boolean;
  receivedAt?: Date | null;
}

export interface UpdateEmailInput {
  threadId?: string | null;
  subject?: string | null;
  snippet?: string | null;
  body?: string | null;
  isRead?: boolean;
  receivedAt?: Date | null;
}

export interface EmailFilter {
  accountId?: string;
  isRead?: boolean;
}

export interface EmailRepositoryPort {
  findById(id: string): Promise<Email | null>;
  findAll(filter?: EmailFilter): Promise<Email[]>;
  create(input: CreateEmailInput): Promise<Email>;
  update(id: string, input: UpdateEmailInput): Promise<Email | null>;
  delete(id: string): Promise<boolean>;
}
