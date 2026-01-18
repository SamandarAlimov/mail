export interface Email {
  id: string;
  from: {
    name: string;
    email: string;
    avatar?: string;
  };
  to: {
    name: string;
    email: string;
  }[];
  subject: string;
  snippet: string;
  body: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  priority: 'high' | 'medium' | 'low' | 'none';
  labels: string[];
  attachments: Attachment[];
  threadId?: string;
  isVerified?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}
