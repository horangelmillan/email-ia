export interface Contact {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  id?: string;
  email: string;
  displayName?: string | null;
}

export interface UpdateContactInput {
  email?: string;
  displayName?: string | null;
}

export interface ContactRepositoryPort {
  findById(id: string): Promise<Contact | null>;
  findByEmail(email: string): Promise<Contact | null>;
  findAll(): Promise<Contact[]>;
  create(input: CreateContactInput): Promise<Contact>;
  update(id: string, input: UpdateContactInput): Promise<Contact | null>;
  delete(id: string): Promise<boolean>;
}
