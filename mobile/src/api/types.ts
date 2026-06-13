export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
}

export interface AuthResponse {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  token: string;
  refreshToken: string;
}

export interface PostAuthor {
  id: string;
  username: string;
  displayName?: string;
}

export interface Post {
  id: string;
  title: string;
  body: string;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  author: PostAuthor;
}

export interface PostRequest {
  title: string;
  body: string;
  notes?: string;
  status: string;
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
  last: boolean;
}
