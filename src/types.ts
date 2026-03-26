export interface Task {
  tier: string;
  price: number;
  warranty: string;
  task_code: string;
  task_name: string;
  service_level: string;
  estimated_time: string;
  custom_handbook: string;
  task_description: string;
  base_material_cost: string;
  payment_plan_price: number;
  service_agreement_price: number;
}

export interface TaskLevel {
  id: number;
  tasks: Task[];
  prefix: string;
  level_number: number;
  custom_level_name: string;
}

export interface TaskGroup {
  name: string[];
  levels: TaskLevel[];
  task_list: {
    task_code: string;
    task_instructions: string | null;
  }[];
}

export interface Category {
  id?: string;
  name: string;
  prefix: string;
  task_groups: TaskGroup[];
  createdAt?: any;
  updatedAt?: any;
}

export interface PricingData {
  categories: Category[];
  service_type: {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    payment_factor: string;
    service_letters: string;
    name_with_format: string;
  };
}

export type Screen =
  | 'splash'
  | 'login'
  | 'home'
  | 'categories'
  | 'task_groups'
  | 'tasks'
  | 'presentation'
  | 'profile'
  | 'settings'
  | 'admin';

export interface AppUser {
  name: string;
  email: string;
  password?: string;
  role?: 'Technician' | 'General User' | 'Admin';
  uid?: string;
  createdAt?: any;
  updatedAt?: any;
}
