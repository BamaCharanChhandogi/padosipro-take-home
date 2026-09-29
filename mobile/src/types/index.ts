export interface User {
  id: string;
  email: string;
  mobile: string | null;
  isVerified: boolean;
  hasCompletedProfile: boolean;
  profile?: Profile | null;
}

export interface Profile {
  id?: string;
  fullName: string;
  phone: string;
  addressArea: string;
  society?: string | null;
  flatUnit?: string | null;
  entryNotes?: string | null;
  businessName?: string | null;
  city?: string;
}

export interface TaskItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  tasks: TaskItem[];
}

export interface UserSelectedTask {
  id: string;
  name: string;
  description?: string;
  categoryName: string;
  categoryIcon: string;
  selectedAt: string;
}
